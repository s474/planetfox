let _videoEl = null;
let _clips   = [];
let _idx     = 0;

/**
 * startVideo({ clips, playbackRate, loop, fit, opacity })
 *   clips        — src string or array of src strings; multiple clips cycle on ended
 *   playbackRate — playback speed multiplier (default 1, e.g. 0.5 = half speed, 2 = double)
 *   loop         — loop a single clip / cycle multiple clips indefinitely (default true)
 *   fit          — CSS object-fit: 'cover' | 'contain' | 'fill' (default 'cover')
 *   opacity      — 0–1 (default 1)
 */
export function startVideo({
    clips        = [],
    playbackRate = 1,
    loop         = true,
    fit          = 'cover',
    opacity      = 1,
} = {}) {
    stopVideo();

    _clips = Array.isArray(clips) ? clips : [clips];
    _idx   = 0;

    if (_clips.length === 0) return;

    _videoEl = document.createElement('video');
    _videoEl.muted        = true;
    _videoEl.playsInline  = true;
    _videoEl.autoplay     = true;
    _videoEl.loop         = loop && _clips.length === 1;
    _videoEl.playbackRate = playbackRate;
    _videoEl.style.cssText = `
        position: fixed; inset: 0;
        width: 100%; height: 100%;
        object-fit: ${fit};
        opacity: ${opacity};
        pointer-events: none;
    `;

    if (_clips.length > 1) {
        _videoEl.addEventListener('ended', () => {
            _idx = (_idx + 1) % _clips.length;
            if (!loop && _idx === 0) return; // played all once, stop
            _videoEl.src = _clips[_idx];
            _videoEl.play().catch(() => {});
        });
    }

    _videoEl.src = _clips[0];
    document.body.appendChild(_videoEl);
    _videoEl.play().catch(() => {});
}

export function stopVideo() {
    if (_videoEl) {
        _videoEl.pause();
        _videoEl.remove();
        _videoEl = null;
    }
}