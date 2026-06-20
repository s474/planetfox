import { startBouncers, stopBouncers } from '../_elements/bouncers.js';
import { startPulse,    stopPulse    } from '../_elements/pulse.js';
import { startScope,    stopScope    } from '../_elements/scope.js';

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

const greenYellow = ['#003300', '#444400', '#003300', '#444400'];
const redBlue     = ['#3a0000', '#00003a', '#3a0000', '#00003a'];

export const scenes = [
    {
        end_time: 14.99,
        enter() { startPulse(); },
        exit()  { stopPulse(); },
    },
    {
        end_time: 27.011,
        enter() { startScope({ color: '#00ff00', lineWidth: 2 }); },
        exit()  { stopScope(); },
    },
    {
        end_time: 38.988,
        enter() {
            startPulse({ text: 'CHELMSFORD 4 LIFE', colors: greenYellow });
        },
        exit() { stopPulse(); },
    },
    {
        end_time: 51.009,
        //enter() {
        //    startBouncers({ images: welcomeImages, minWidth: 120, maxWidth: 3600, syncBpm: true });
        //},
        //exit() { stopBouncers(); },
        enter() { startScope({ color: '#ff0000', lineWidth: 200 }); },
        exit()  { stopScope(); },
    },
    {
        end_time: 63.007,
        enter() {
            startPulse({ text: 'SSSSSSSSSSS', colors: redBlue });
        },
        exit() { stopPulse(); },
    },
    {
        end_time: 78.009,
        enter() {
            startBouncers({ images: welcomeImages, minWidth: 120, maxWidth: 4600, syncBpm: true });
        },
        exit() { stopBouncers(); },
    },
    {
        end_time: 87.007,
        enter() {
            startPulse({ text: 'PLANET FOX', colors: greenYellow });
        },
        exit() { stopPulse(); },
    },
    {
        end_time: null,
        enter() { startScope({ color: '#ff00ff', lineWidth: 100 }); },
        exit()  { stopScope(); },
    },
];