let _canvas  = null;
let _rafId   = null;
let _hueBase = 0;
let _frame   = 0;

const rand = (a, b) => Math.random() * (b - a) + a;
const TAU  = Math.PI * 2;

/**
 * startParticles({ count, symmetry, trailAlpha, scale, slideshowImages, slideshowInterval, imageRotateSpeed, imagePulseSpeed })
 *   count              — number of particles (default 180)
 *   symmetry           — rotational symmetry (default 6)
 *   trailAlpha         — how quickly trails fade; lower = longer (default 0.06)
 *   scale              — multiplier for particle size (default 1)
 *   slideshowImages    — array of image src paths; images fill screen and cycle
 *   slideshowInterval  — ms between image changes (default 3000)
 *   imageRotateSpeed   — radians per frame the image slowly spins (default 0)
 *   imagePulseSpeed    — how fast brightness oscillates washed↔dark (default 0.008 rad/frame)
 */
export function startParticles({
    count             = 180,
    symmetry          = 6,
    trailAlpha        = 0.06,
    scale             = 1,
    slideshowImages   = [],
    slideshowInterval = 3000,
    imageRotateSpeed  = 0.003,
    imagePulseSpeed   = 0.008,
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

    // --- Slideshow ---

    let imgs         = [];
    let imgIndex     = 0;
    let imgRotation  = 0;
    let imgAlpha     = 0;      // current image opacity (fades in/out)
    let fadeDir      = 1;      // 1 = fading in, -1 = fading out
    let slideTimer   = null;

    if (slideshowImages.length > 0) {
        imgs = slideshowImages.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        const scheduleNext = () => {
            slideTimer = setTimeout(() => {
                // Fade out current, then swap and fade in
                fadeDir = -1;
                setTimeout(() => {
                    imgIndex = (imgIndex + 1) % imgs.length;
                    fadeDir  = 1;
                    scheduleNext();
                }, 600); // fade-out duration
            }, slideshowInterval);
        };
        scheduleNext();
    }

    function drawSlideshow(cx, cy) {
        if (imgs.length === 0) return;
        const img = imgs[imgIndex];
        if (!img.complete || img.naturalWidth === 0) return;

        // Crossfade between images
        imgAlpha = Math.max(0, Math.min(1, imgAlpha + fadeDir * 0.02));

        // Slow sine pulse: oscillates between dim (0.08) and washed-out bright (0.92)
        const pulse = 0.5 + 0.5 * Math.sin(_frame * imagePulseSpeed);
        const finalAlpha = imgAlpha * (0.08 + 0.84 * pulse);

        // Cover-fit: scale so image fills the canvas, crop edges if needed
        const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth  * sc;
        const dh = img.naturalHeight * sc;

        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.globalCompositeOperation = 'screen';

        if (imageRotateSpeed !== 0) {
            imgRotation += imageRotateSpeed;
            // Scale up by √2 so corners don't show during rotation
            const rs = Math.SQRT2;
            ctx.translate(cx, cy);
            ctx.rotate(imgRotation);
            ctx.drawImage(img, -dw * rs / 2, -dh * rs / 2, dw * rs, dh * rs);
        } else {
            ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        }

        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
    }

    // --- Particles ---

    function makeParticle() {
        const angle  = rand(0, TAU);
        const speed  = rand(0.5, 3.5);
        const spread = Math.min(W, H) * 0.45;
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
    const symAngles = Array.from({ length: symmetry }, (_, i) => (i / symmetry) * TAU);

    // --- Draw loop ---

    function draw() {
        _frame++;
        _hueBase = (_hueBase + 0.4) % 360;

        ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        // Draw slideshow image behind particles
        drawSlideshow(cx, cy);

        for (const p of particles) {
            p.wobble += p.wobbleFreq;
            p.vx += Math.cos(p.wobble) * p.wobbleAmp * 0.02;
            p.vy += Math.sin(p.wobble) * p.wobbleAmp * 0.02;

            const dist = Math.hypot(p.rx, p.ry) || 1;
            p.vx += (-p.ry / dist) * 0.04;
            p.vy += ( p.rx / dist) * 0.04;

            p.vx += -p.rx * 0.0003;
            p.vy += -p.ry * 0.0003;
            p.vx *= 0.994;
            p.vy *= 0.994;

            p.rx += p.vx;
            p.ry += p.vy;
            p.hue = (p.hue + p.hueSpeed) % 360;
            p.age++;

            if (p.age > p.life) Object.assign(p, makeParticle(), { age: 0 });

            const alpha = Math.sin((p.age / p.life) * Math.PI);
            const size  = p.size * (1 + 0.5 * Math.sin(p.age * p.sizeSpeed + p.sizePhase));
            const hue   = (p.hue + _hueBase) % 360;

            ctx.fillStyle = `hsla(${(hue + 180) % 360},100%,50%,${alpha * 0.15})`;
            for (const a of symAngles) {
                const cos = Math.cos(a), sin = Math.sin(a);
                ctx.beginPath();
                ctx.arc(p.rx * cos - p.ry * sin + cx, p.rx * sin + p.ry * cos + cy, size * 2.5 * scale, 0, TAU);
                ctx.fill();
            }

            ctx.fillStyle = `hsla(${hue},100%,65%,${alpha})`;
            for (const a of symAngles) {
                const cos = Math.cos(a), sin = Math.sin(a);
                ctx.beginPath();
                ctx.arc(p.rx * cos - p.ry * sin + cx, p.rx * sin + p.ry * cos + cy, size, 0, TAU);
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
    _frame   = 0;
}