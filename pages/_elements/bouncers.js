import { getAudioTime, bpm, beat_offset } from '../_base.js';

let _els = [];
let _rafId = null;
let _resizeId = null;

const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min, max) => Math.random() * (max - min) + min;
const sign  = ()         => Math.random() < 0.5 ? 1 : -1;

/**
 * startBouncers({ images, minWidth, maxWidth, randomizeMs, syncBpm, container })
 *   images       — array of src strings
 *   minWidth     — minimum px width (default 60)
 *   maxWidth     — maximum px width (default 300)
 *   randomizeMs  — interval in ms to randomise sizes, 0 to disable (default 66)
 *                  ignored when syncBpm is true
 *   syncBpm      — randomise sizes on each beat instead of on a timer (default false)
 *   container    — DOM element to append to (default document.body)
 */
export function startBouncers({
    images      = [],
    minWidth    = 60,
    maxWidth    = 300,
    randomizeMs = 66,
    syncBpm     = false,
    container   = document.body,
} = {}) {
    stopBouncers();

    _els = images.map(src => {
        const img = document.createElement('img');
        img.className = 'bouncer';
        img.src = src;
        img.style.width = rand(minWidth, maxWidth) + 'px';
        container.appendChild(img);
        return img;
    });

    requestAnimationFrame(() => {
        const states = _els.map(el => ({
            el,
            x:  randF(0, Math.max(0, window.innerWidth  - el.offsetWidth)),
            y:  randF(0, Math.max(0, window.innerHeight - el.offsetHeight)),
            vx: randF(1.5, 4) * sign(),
            vy: randF(1.5, 4) * sign(),
        }));

        const randomizeSizes = () => {
            for (const s of states) s.el.style.width = rand(minWidth, maxWidth) + 'px';
        };

        let lastBeat = -1;

        function step() {
            const W = window.innerWidth;
            const H = window.innerHeight;
            for (const s of states) {
                const pw = s.el.offsetWidth;
                const ph = s.el.offsetHeight;
                s.x += s.vx; s.y += s.vy;
                if (s.x <= 0 || s.x + pw >= W) s.vx = -s.vx;
                if (s.y <= 0 || s.y + ph >= H) s.vy = -s.vy;
                s.el.style.left = s.x + 'px';
                s.el.style.top  = s.y + 'px';
            }

            if (syncBpm && bpm) {
                const t = getAudioTime() - beat_offset;
                if (t >= 0) {
                    const beat = Math.floor(t * bpm / 60);
                    if (beat !== lastBeat) {
                        lastBeat = beat;
                        randomizeSizes();
                    }
                }
            }

            _rafId = requestAnimationFrame(step);
        }
        step();

        if (!syncBpm && randomizeMs > 0) {
            _resizeId = setInterval(randomizeSizes, randomizeMs);
        }
    });
}

export function stopBouncers() {
    if (_rafId)    { cancelAnimationFrame(_rafId); _rafId = null; }
    if (_resizeId) { clearInterval(_resizeId); _resizeId = null; }
    for (const el of _els) el.remove();
    _els = [];
}