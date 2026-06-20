const params = new URLSearchParams(window.location.search);
export const PERF_MODE = params.get('perf') === '1';

let _scenes = [];
let _currentIndex = -1;
let _autoTimer = null;
let _audioEl = null;
let _perfStartTime = null; // performance.now() when perf audio was first detected

export let analyser    = null; // available to elements for visualisers
export let bpm         = null; // beats per minute for the current track
export let beat_offset = 0;    // seconds to the first beat

// --- Scene engine ---

function runScene(index) {
    if (index < 0 || index >= _scenes.length) return;

    if (_currentIndex >= 0 && _scenes[_currentIndex].exit) {
        _scenes[_currentIndex].exit();
    }
    clearTimeout(_autoTimer);
    _autoTimer = null;

    _currentIndex = index;
    const scene = _scenes[_currentIndex];
    if (scene.enter) scene.enter();
    updateOverlay();

    if (scene.end_time != null) {
        const currentSec = _audioEl
            ? _audioEl.currentTime
            : _perfStartTime != null ? (performance.now() - _perfStartTime) / 1000 : 0;
        const delay = (scene.end_time - currentSec) * 1000;
        if (delay > 0) _autoTimer = setTimeout(() => nextScene(), delay);
    }
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
let _overlayVisible = true;

function createOverlay() {
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'pf-overlay';
    document.body.appendChild(_overlayEl);
    updateOverlay();
}

function updateOverlay() {
    if (!_overlayEl) return;
    _overlayEl.textContent =
        `${_currentIndex + 1} / ${_scenes.length}${PERF_MODE ? ' · PERF' : ''}  [H] hide`;
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

// --- Scene 0 with beat_offset delay ---

function startFromBeginning() {
    const delayMs = (beat_offset || 0) * 1000;
    if (delayMs > 0) {
        setTimeout(() => runScene(0), delayMs);
    } else {
        runScene(0);
    }
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
}

// --- Init ---

export function init(scenes, options = {}) {
    _scenes = scenes;

    if (options.bpm         != null) bpm         = options.bpm;
    if (options.beat_offset != null) beat_offset = options.beat_offset;

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