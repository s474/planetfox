import { analyser } from '../_base.js';

let _canvas = null;
let _rafId  = null;

/**
 * startScope({ color, lineWidth })
 *   color     — waveform stroke colour (default '#00ff00')
 *   lineWidth — stroke width in px (default 2)
 */
export function startScope({ color = '#00ff00', lineWidth = 2 } = {}) {
    stopScope();

    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;';
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
    document.body.appendChild(_canvas);

    const ctx = _canvas.getContext('2d');

    function resize() {
        _canvas.width  = window.innerWidth;
        _canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    _canvas._cleanup = () => window.removeEventListener('resize', resize);

    function draw() {
        const W = _canvas.width;
        const H = _canvas.height;

        ctx.clearRect(0, 0, W, H);

        if (analyser) {
            const buf = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(buf);

            ctx.strokeStyle = color;
            ctx.lineWidth   = lineWidth;
            ctx.beginPath();

            const sliceW = W / buf.length;
            let x = 0;
            for (let i = 0; i < buf.length; i++) {
                const y = (buf[i] / 128) * (H / 2);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceW;
            }
            ctx.lineTo(W, H / 2);
            ctx.stroke();
        }

        _rafId = requestAnimationFrame(draw);
    }
    draw();
}

export function stopScope() {
    if (_rafId)  { cancelAnimationFrame(_rafId); _rafId = null; }
    if (_canvas) { _canvas._cleanup?.(); _canvas.remove(); _canvas = null; }
}