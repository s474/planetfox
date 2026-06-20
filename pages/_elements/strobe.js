import { getAudioTime, bpm, beat_offset } from '../_base.js';

let _rafId       = null;
let _flashTimer  = null;
let _lastSubBeat = -1;

/**
 * startStrobe({ flashesPerBeat, flashDuration })
 *   flashesPerBeat — how many flashes per beat (default 2)
 *   flashDuration  — how long each flash stays white in ms (default 60)
 */
export function startStrobe({ flashesPerBeat = 2, flashDuration = 60 } = {}) {
    stopStrobe();
    _lastSubBeat = -1;

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
    clearTimeout(_flashTimer);
    document.body.style.background = '#fff';
    _flashTimer = setTimeout(() => {
        document.body.style.background = '#000';
    }, duration);
}

export function stopStrobe() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    clearTimeout(_flashTimer);
    document.body.style.background = '#000';
}