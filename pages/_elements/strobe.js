import { getAudioTime, bpm, beat_offset } from '../_base.js';

let _rafId       = null;
let _flashTimer  = null;
let _flashEl     = null;
let _lastSubBeat = -1;

/**
 * startStrobe({ flashesPerBeat, flashDuration, color })
 *   flashesPerBeat — how many flashes per beat (default 2)
 *   flashDuration  — how long each flash stays on in ms (default 60)
 *   color          — flash colour (default '#fff')
 */
export function startStrobe({ flashesPerBeat = 2, flashDuration = 60, color = '#fff' } = {}) {
    stopStrobe();
    _lastSubBeat = -1;

    // Overlay div sits above video, canvas, everything
    _flashEl = document.createElement('div');
    _flashEl.style.cssText = `
        position: fixed; inset: 0;
        background: ${color};
        opacity: 0;
        pointer-events: none;
        z-index: 9990;
        transition: opacity 0s;
    `;
    document.body.appendChild(_flashEl);

    function tick() {
        if (bpm) {
            const t = getAudioTime() - beat_offset;
            if (t >= 0) {
                const subBeat = Math.floor(t * bpm / 60 * flashesPerBeat);
                if (subBeat !== _lastSubBeat) {
                    _lastSubBeat = subBeat;
                    flash(flashDuration);
                }
            }
        }
        _rafId = requestAnimationFrame(tick);
    }
    tick();
}

function flash(duration) {
    if (!_flashEl) return;
    clearTimeout(_flashTimer);
    _flashEl.style.opacity = '1';
    _flashTimer = setTimeout(() => {
        if (_flashEl) _flashEl.style.opacity = '0';
    }, duration);
}

export function stopStrobe() {
    if (_rafId)  { cancelAnimationFrame(_rafId); _rafId = null; }
    clearTimeout(_flashTimer);
    if (_flashEl) { _flashEl.remove(); _flashEl = null; }
}
