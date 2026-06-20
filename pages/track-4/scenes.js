import { startBouncers, stopBouncers } from '../_elements/bouncers.js';
import { startStrobe,   stopStrobe   } from '../_elements/strobe.js';
import { startPulse,    stopPulse    } from '../_elements/pulse.js';

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

// --- Scenes ---

export const scenes = [
    {
        end_time: 10.081,
        enter() {
            document.body.style.background = '#000';
            startBouncers({ images: welcomeImages, minWidth: 60, maxWidth: 280, syncBpm: true });
        },
        exit() {
            stopBouncers();
        },
    },
    {
        end_time: 17.734,
        enter() {
            startPulse();
        },
        exit() {
            stopPulse();
        },
    },
    {
        end_time: 33.471,
        enter() {
            startStrobe({ flashesPerBeat: 1, flashDuration: 60 });
        },
        exit() {
            stopStrobe();
        },
    },
    {
        end_time: null,
        enter() {
            document.body.style.background = '#890d0d';
            startBouncers({ images: welcomeImages, minWidth: 60, maxWidth: 2800, syncBpm: true });
        },
        exit() {
            stopBouncers();
        },
    },
];