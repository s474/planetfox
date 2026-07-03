const params = new URLSearchParams(window.location.search);
export const PERF_MODE = params.get('perf') === '1';

let _scenes = [];
let _currentIndex = -1;
let _timingRaf = null;
let _audioEl = null;
let _perfStartTime = null; // performance.now() when perf audio was first detected

export let analyser    = null; // available to elements for visualisers
export let bpm         = null; // beats per minute for the current track
export let beat_offset = 0;    // seconds to the first beat

export function getAudioTime() {
    if (_audioEl) return _audioEl.currentTime;
    if (_perfStartTime != null) return (performance.now() - _perfStartTime) / 1000;
    return 0;
}

// --- Scene engine ---

// rAF loop polls audio.currentTime each frame rather than calculating a setTimeout
// delay upfront. This is immune to buffering delays that make currentTime jump.
function startTimingLoop() {
    if (_timingRaf) return;
    (function tick() {
        const scene = _scenes[_currentIndex];
        if (scene && scene.end_time != null && getAudioTime() >= scene.end_time) {
            nextScene();
            return;
        }
        _timingRaf = requestAnimationFrame(tick);
    })();
}

function stopTimingLoop() {
    if (_timingRaf) { cancelAnimationFrame(_timingRaf); _timingRaf = null; }
}

function runScene(index) {
    if (index < 0 || index >= _scenes.length) return;

    if (_currentIndex >= 0 && _scenes[_currentIndex].exit) {
        _scenes[_currentIndex].exit();
    }
    stopTimingLoop();

    _currentIndex = index;
    const scene = _scenes[_currentIndex];
    if (scene.enter) scene.enter();
    updateOverlay();

    if (scene.end_time != null) startTimingLoop();
}

export function nextScene() {
    if (_currentIndex < _scenes.length - 1) runScene(_currentIndex + 1);
}

export function prevScene() {
    if (_currentIndex > 0) runScene(_currentIndex - 1);
}

export function goToScene(n) {
    runScene(n);
}

// --- Overlay ---

let _overlayEl;
let _promptEl;
let _overlayVisible = true;
let _title = '';

function createOverlay() {
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'pf-overlay';
    document.body.appendChild(_overlayEl);
    updateOverlay();

    if (!PERF_MODE) {
        _promptEl = document.createElement('div');
        _promptEl.id = 'pf-prompt';
        _promptEl.textContent = 'PRESS SPACE TO START';
        document.body.appendChild(_promptEl);
    }
}

function updateOverlay() {
    if (!_overlayEl) return;
    const titleLine = _title ? `${_title}\n` : '';
    _overlayEl.textContent =
        `${titleLine}${_currentIndex + 1} / ${_scenes.length}${PERF_MODE ? ' · PERF' : ''}  [H] hide`;
}

function hidePrompt() {
    if (_promptEl) { _promptEl.remove(); _promptEl = null; }
}

function toggleOverlay() {
    _overlayVisible = !_overlayVisible;
    _overlayEl.style.display = _overlayVisible ? '' : 'none';
}

// --- Cursor auto-hide ---

let _cursorTimer;
function resetCursor() {
    document.body.classList.remove('pf-cursor-hidden');
    clearTimeout(_cursorTimer);
    _cursorTimer = setTimeout(() => document.body.classList.add('pf-cursor-hidden'), 3000);
}

// --- Fullscreen ---

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

// --- Scene 0 start ---

// Polls audio time in rAF (same as scene transitions) so the start is immune
// to Safari's gap between play() resolving and audio actually producing output.
function startFromBeginning() {
    // Use a tiny minimum so we only fire once currentTime is genuinely advancing.
    const target = beat_offset > 0 ? beat_offset : 0.001;
    (function waitForBeat() {
        if (getAudioTime() >= target) {
            runScene(0);
        } else {
            requestAnimationFrame(waitForBeat);
        }
    })();
}

// --- Keyboard ---

function setupKeyboard() {
    document.addEventListener('keydown', async e => {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (PERF_MODE) {
                    nextScene();
                } else if (_audioEl) {
                    if (_audioEl.paused) {
                        await _audioEl.play();
                        if (_currentIndex < 0) startFromBeginning();
                    } else {
                        _audioEl.pause();
                    }
                } else {
                    _currentIndex < 0 ? runScene(0) : nextScene();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextScene();
                break;
            case 'ArrowLeft':
            case 'Backspace':
                e.preventDefault();
                prevScene();
                break;
            case 'KeyF':
                toggleFullscreen();
                break;
            case 'KeyH':
                toggleOverlay();
                break;
            default:
                if (e.code.startsWith('Digit')) {
                    const n = parseInt(e.key, 10) - 1;
                    if (n >= 0 && n < _scenes.length) runScene(n);
                }
        }
    });
}

// --- Perf mode: detect incoming audio then start scene 0 ---

async function setupPerfAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        ctx.createMediaStreamSource(stream).connect(analyser);

        const buf = new Uint8Array(analyser.frequencyBinCount);
        let triggered = false;

        (function detect() {
            analyser.getByteTimeDomainData(buf);
            if (!triggered) {
                let sum = 0;
                for (const v of buf) sum += (v - 128) ** 2;
                if (Math.sqrt(sum / buf.length) > 8) {
                    triggered = true;
                    _perfStartTime = performance.now();
                    startFromBeginning();
                }
            }
            requestAnimationFrame(detect);
        })();
    } catch (err) {
        console.warn('Perf audio unavailable:', err.message);
        // Fall back — spacebar will still work
    }
}

// --- Normal mode: optional audio element ---

function setupFileAudio(src) {
    _audioEl = document.createElement('audio');
    _audioEl.src = src;
    _audioEl.preload = 'metadata';
    document.body.appendChild(_audioEl);

    // AudioContext must be created inside a user-gesture handler
    _audioEl.addEventListener('play', () => {
        hidePrompt();
        if (analyser) return;
        const ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        const source = ctx.createMediaElementSource(_audioEl);
        source.connect(analyser);
        analyser.connect(ctx.destination);
    }, { once: true });

}

// --- Init ---

export function init(scenes, options = {}) {
    _scenes = scenes;

    if (options.bpm         != null) bpm         = options.bpm;
    if (options.beat_offset != null) beat_offset = options.beat_offset;
    if (options.title       != null) _title      = options.title;

    createOverlay();
    setupKeyboard();

    document.addEventListener('mousemove', resetCursor);
    resetCursor();

    if (PERF_MODE) {
        setupPerfAudio();
    } else if (options.audioSrc) {
        setupFileAudio(options.audioSrc);
    }
}