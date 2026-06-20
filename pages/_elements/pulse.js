let _el = null;
let _styleEl = null;

/**
 * startPulse({ text, colors, textColor })
 *   text      — text to display (default 'PLANET FOX')
 *   colors    — array of 2–4 hex/css colours cycling as background (default dark purple/green/red/blue)
 *   textColor — CSS colour for the text (default faded white)
 */
export function startPulse({
    text      = 'PLANET FOX',
    colors    = ['#1a003a', '#003a1a', '#3a001a', '#00183a'],
    textColor = 'rgba(255,255,255,0.12)',
} = {}) {
    stopPulse();

    // Build keyframe stops evenly from the colors array
    const stops = colors.map((c, i) =>
        `${Math.round(i * 100 / colors.length)}% { background: ${c}; }`
    ).join(' ');

    _styleEl = document.createElement('style');
    _styleEl.textContent = `
        @keyframes pf-pulse-bg {
            ${stops}
            100% { background: ${colors[0]}; }
        }
        @keyframes pf-drift {
            0%   { transform: translate(-50%,-50%) scale(1)    rotate(-2deg); }
            50%  { transform: translate(-50%,-54%) scale(1.08) rotate(2deg);  }
            100% { transform: translate(-50%,-50%) scale(1)    rotate(-2deg); }
        }
        #pf-pulse {
            position: fixed; inset: 0;
            animation: pf-pulse-bg 6s ease-in-out infinite;
            display: flex; align-items: center; justify-content: center;
        }
        #pf-pulse span {
            position: absolute; top: 50%; left: 50%;
            font-size: clamp(3rem, 12vw, 9rem);
            font-weight: 900;
            letter-spacing: 0.15em;
            color: ${textColor};
            text-transform: uppercase;
            white-space: nowrap;
            font-family: 'Courier New', Courier, monospace;
            animation: pf-drift 8s ease-in-out infinite;
            user-select: none;
        }
    `;
    document.head.appendChild(_styleEl);

    _el = document.createElement('div');
    _el.id = 'pf-pulse';
    _el.innerHTML = `<span>${text}</span>`;
    document.body.appendChild(_el);
}

export function stopPulse() {
    if (_el)      { _el.remove();      _el = null;      }
    if (_styleEl) { _styleEl.remove(); _styleEl = null; }
}