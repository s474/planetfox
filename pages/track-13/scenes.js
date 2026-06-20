import { startScope,     stopScope     } from '../_elements/scope.js';
import { startStrobe,    stopStrobe    } from '../_elements/strobe.js';
import { startParticles, stopParticles } from '../_elements/particles.js';

export const scenes = [
    {
        end_time: null,
        enter() { startScope({ color: '#00ff00', lineWidth: 2 }); },
        exit()  { stopScope(); },
    },
    {
        end_time: null,
        enter() {
            document.body.style.background = '#000';
            startStrobe({ flashesPerBeat: 2, flashDuration: 60 });
        },
        exit() { stopStrobe(); },
    },
    {
        end_time: null,
        enter() { startParticles(); },
        exit()  { stopParticles(); },
    },
];
