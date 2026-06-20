let _canvas  = null;
let _rafId   = null;
let _hueBase = 0;

const rand  = (a, b) => Math.random() * (b - a) + a;
const TAU   = Math.PI * 2;

/**
 * startParticles({ count, symmetry, trailAlpha })
 *   count      — number of particles (default 180)
 *   symmetry   — rotational symmetry, e.g. 6 draws each particle at 6 positions (default 6)
 *   trailAlpha — how quickly trails fade; lower = longer trails (default 0.06)
 */
export function startParticles({
    count      = 180,
    symmetry   = 6,
    trailAlpha = 0.06,
    scale      = 1,
} = {}) {
    stopParticles();

    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;';
    document.body.appendChild(_canvas);

    const ctx = _canvas.getContext('2d');
    let W, H;

    function resize() {
        W = _canvas.width  = window.innerWidth;
        H = _canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    _canvas._cleanup = () => window.removeEventListener('resize', resize);

    // --- Particle class ---

    function makeParticle() {
        const angle  = rand(0, TAU);
        const speed  = rand(0.5, 3.5);
        const spread = Math.min(W, H) * 0.45; // spawn across most of the screen
        return {
            rx: rand(-spread, spread),
            ry: rand(-spread, spread),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            hue:        rand(0, 360),
            hueSpeed:   rand(0.8, 3),
            size:       rand(2, 7) * scale,
            sizePhase:  rand(0, TAU),
            sizeSpeed:  rand(0.03, 0.09),
            wobble:     rand(0, TAU),
            wobbleAmp:  rand(0.4, 2.0) * Math.sqrt(scale),
            wobbleFreq: rand(0.02, 0.07),
            life:       rand(80, 220),
            age:        rand(0, 80),
        };
    }

    const particles = Array.from({ length: count }, makeParticle);

    // Pre-compute symmetry angles
    const symAngles = Array.from({ length: symmetry }, (_, i) => (i / symmetry) * TAU);

    // --- Draw loop ---

    function draw() {
        _hueBase = (_hueBase + 0.4) % 360;

        // Trail: low-alpha black fill preserves colour history
        ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        for (const p of particles) {
            // Update
            p.wobble += p.wobbleFreq;
            p.vx += Math.cos(p.wobble) * p.wobbleAmp * 0.02;
            p.vy += Math.sin(p.wobble) * p.wobbleAmp * 0.02;

            // Soft vortex — slight tangential push keeps particles swirling
            const dist = Math.hypot(p.rx, p.ry) || 1;
            const tx = -p.ry / dist;
            const ty =  p.rx / dist;
            p.vx += tx * 0.04;
            p.vy += ty * 0.04;

            // Very gentle pull toward centre stops particles flying offscreen
            p.vx += -p.rx * 0.0003;
            p.vy += -p.ry * 0.0003;

            // Damping so speed doesn't blow up
            p.vx *= 0.994;
            p.vy *= 0.994;

            p.rx  += p.vx;
            p.ry  += p.vy;
            p.hue  = (p.hue + p.hueSpeed) % 360;
            p.age++;

            if (p.age > p.life) Object.assign(p, makeParticle(), { age: 0 });

            // Draw at each symmetry rotation
            const alpha = Math.sin((p.age / p.life) * Math.PI); // fade in/out
            const size  = p.size * (1 + 0.5 * Math.sin(p.age * p.sizeSpeed + p.sizePhase));
            const hue   = (p.hue + _hueBase) % 360;

            // Complementary ghost slightly offset for extra trippy depth
            ctx.fillStyle = `hsla(${(hue + 180) % 360},100%,50%,${alpha * 0.15})`;
            for (const a of symAngles) {
                const cos = Math.cos(a), sin = Math.sin(a);
                const sx = p.rx * cos - p.ry * sin + cx;
                const sy = p.rx * sin + p.ry * cos + cy;
                ctx.beginPath();
                ctx.arc(sx, sy, size * 2.5 * scale, 0, TAU);
                ctx.fill();
            }

            // Main particle
            ctx.fillStyle = `hsla(${hue},100%,65%,${alpha})`;
            for (const a of symAngles) {
                const cos = Math.cos(a), sin = Math.sin(a);
                const sx = p.rx * cos - p.ry * sin + cx;
                const sy = p.rx * sin + p.ry * cos + cy;
                ctx.beginPath();
                ctx.arc(sx, sy, size, 0, TAU);
                ctx.fill();
            }
        }

        _rafId = requestAnimationFrame(draw);
    }
    draw();
}

export function stopParticles() {
    if (_rafId)  { cancelAnimationFrame(_rafId); _rafId = null; }
    if (_canvas) { _canvas._cleanup?.(); _canvas.remove(); _canvas = null; }
    _hueBase = 0;
}