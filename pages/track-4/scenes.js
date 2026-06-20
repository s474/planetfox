import { startBouncers, stopBouncers } from '../_elements/bouncers.js';

// Paths relative to this file's location
const WELCOME = '../../holding_page/WELCOME/';

const welcomeImages = [
    'aavicki_bakewel2.gif', 'aavicki_banbear.gif', 'aavicki_bancat.gif',
    'aavicki_bangirls.gif', 'aavicki_banguit.gif', 'aavicki_banmous2.gif',
    'aavicki_banword1.gif', 'aavicki_banword2.gif', 'aavicki_daisyban.gif',
    'boogie_welcome.gif',   'dramab.gif',           'gbarn_welcome_a.gif',
    'generic9.gif',         'ladyohban_welcome1.gif','ladyohban_welcome2.gif',
    'pat_blackrosehead.gif','pat_LRb-head.gif',     'pat_peperhead.gif',
    'pat_R-rose1heada.gif', 'sharon_welcome1.gif',  'sharon_welcome3.gif',
    'sharon_welcome5.gif',  'sharon_welcome6.gif',  'sharon_welcome7.gif',
    'sharon_welcome8.gif',  'spider1.gif',          'toc_ballwel.gif',
    'toc_blkwel.gif',       'toc_decwel.gif',
].map(f => WELCOME + f);

// --- Scene 2 helpers ---

let _pulseEl = null;

function startPulse() {
    _pulseEl = document.createElement('div');
    _pulseEl.id = 'pf-pulse';
    _pulseEl.innerHTML = '<span>PLANET FOX</span>';
    document.body.appendChild(_pulseEl);
}

function stopPulse() {
    if (_pulseEl) { _pulseEl.remove(); _pulseEl = null; }
}

// --- Scenes ---

export const scenes = [
    {
        end_time: 10.081,
        enter() {
            document.body.style.background = '#000';
            startBouncers({ images: welcomeImages, minWidth: 60, maxWidth: 280 });
        },
        exit() {
            stopBouncers();
        },
    },
    {
        duration: null,
        enter() {
            document.body.style.background = '#000';
            startPulse();
        },
        exit() {
            stopPulse();
            document.body.style.background = '#000';
        },
    },
];