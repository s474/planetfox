import { startScope,     stopScope     } from '../_elements/scope.js';
import { startStrobe,    stopStrobe    } from '../_elements/strobe.js';
import { startVideo, stopVideo } from '../_elements/video.js';

export const scenes = [
    {
        end_time: null,
        enter() {
            startStrobe({ flashesPerBeat: 2, flashDuration: 60, color: '#ff5ad9' });
            startScope({ color: '#1e90ff', lineWidth: 2 });
        },
        exit() {
            stopStrobe();
            stopScope();
        },
    },
    {
        end_time: null,
        enter() {
            startVideo({ clips: '../../video/foxpenguins1_lo.mp4', playbackRate: 1 });
            startStrobe({ flashesPerBeat: 2, flashDuration: 60, color: '#0022ff' });
        },
        exit() { 
            stopVideo(); 
            stopStrobe();
        },
    },
    {
        end_time: null,
        enter() {
            startVideo({ clips: '../../video/foxpenguins1_lo.mp4', playbackRate: 1 });
            startStrobe({ flashesPerBeat: 2, flashDuration: 60, color: '#ff5ad9' });
        },
        exit() { 
            stopVideo(); 
            stopStrobe();
        },
    },
    {
        end_time: null,
        enter() {
            startVideo({ clips: '../../video/foxpenguins1_lo.mp4', playbackRate: 1 });
            startStrobe({ flashesPerBeat: 2, flashDuration: 60, color: '#ff5ad9' });
            startScope({ color: '#1e90ff', lineWidth: 2 });
        },
        exit() {
            stopVideo();
            stopStrobe();
            stopScope();
        },
    },
];