# Planet Fox Pages — Requirements Summary

## Concept

Each track gets its own visual web page: an animated, interactive "web video" tied to the song. Pages double as live performance backdrops — projected fullscreen while the track plays.

---

## Core Requirements

### Per-track visual pages
- One page per track, linked to the track's DB record
- Each page has its own visual identity — animated elements, colour palette, imagery
- Elements can be anything: bouncers (like index.html), CSS animations, canvas effects, particles, oscilloscopes, video loops, text animations, etc.
- Pages should work fullscreen (F11 / browser fullscreen API) for projection

### Scene system
- Each page is divided into **scenes** — discrete visual states within the page
- Scenes play in sequence (auto-advance after a set duration, or manually triggered)
- Each scene can have different elements, speeds, colours, animations active
- Minimum: a scene has a start state and an end state; transitions between them

### Interactivity
- **Spacebar** → advance to next scene
- **Backspace or left arrow** → go back a scene (useful during rehearsal)
- **F** or **F11** → toggle fullscreen
- Optional: number keys jump to scene N directly
- Mouse/touch interaction optional per-page (e.g. clicking spawns an element)

### Audio integration
- Page can optionally play the track (using the existing player/stream.php)
- BPM field (to be added to DB) can drive beat-synced animations
- Beat offset field to align animations to the actual first beat
- Oscilloscope/frequency visualizer as an available element type

### Live performance mode
- A "performance URL" opens the page in a clean, no-UI fullscreen state (no browser chrome)
- Optionally suppress cursor after a timeout
- Scene position visible to performer via a small overlay (toggleable, e.g. press H to hide/show)

---

## Architecture Sketch

```
/pages/
  _base.js          ← shared scene engine (keyboard handler, sequencer, fullscreen)
  _base.css         ← shared reset + fullscreen styles
  track-{id}/
    index.html      ← the visual page for this track
    scenes.js       ← scene definitions for this track
  ...

/player/api/
  tracks.php        ← already exists; add page_path field to tracks table
```

### DB additions
| Field | Type | Purpose |
|---|---|---|
| `bpm` | FLOAT | Beat tempo for animation sync |
| `beat_offset` | FLOAT | Seconds to first beat |

### Scene engine (\_base.js)
- `scenes[]` array, each entry is `{ end_time, enter(), exit() }`
- `end_time` — absolute track position in seconds when this scene ends and the next begins; `null` for manual-only advance
- `enter()` activates the scene's animations/elements
- `exit()` tears them down (or leaves them for blending)
- Spacebar/arrow keys call `nextScene()` / `prevScene()`
- Auto-advance timer calculated as `(end_time - audio.currentTime) * 1000` — no offset arithmetic needed

---

## Build Order (suggested)

1. Add `bpm`, `beat_offset` to tracks DB table
2. Build `_base.js` scene engine + keyboard/fullscreen handling
3. Build `_base.css`
4. Create one example track page (reuse bouncer pattern from index.html as scene 1)
5. Add a second contrasting scene to prove the scene-switching works
6. Wire track player to open its page (`?track=ID` already works in player)
7. Add BPM-sync hook to `_base.js` once BPM data exists
8. Build out more track pages

---

## Decisions

1. **Scene definitions** — JS file per track (`scenes.js`), arbitrary code in `enter()`/`exit()`
2. **Performance mode** — `?perf=1` in the querystring switches behaviour:
   - `?perf=1` (on stage): audio comes from external source (PA/DAW). Page opens, taps the audio input via `getUserMedia`, and listens for incoming signal. When audio level crosses a threshold, scene 1 starts automatically. Spacebar still advances scenes manually.
   - Default (no param): spacebar starts/stops the track audio and scenes together — self-contained rehearsal/preview mode.
3. **Standalone per-track pages** — no master show controller for now
4. **Free-form aesthetic** per track, but with a **shared elements library** (`/pages/_elements/`) that any page can import — oscilloscope, bouncers, particles, etc.

---

## Shared Elements Library

```
/pages/
  _base.js            ← scene engine, keyboard handler, fullscreen, perf-mode audio detection
  _base.css           ← fullscreen reset, cursor hide, overlay styles
  _elements/
    oscilloscope.js   ← canvas oscilloscope (works from stream or mic input)
    bouncers.js       ← the bouncing image system from index.html, parameterised
    particles.js      ← particle emitter
    (more as needed)
  track-{id}/
    index.html
    scenes.js         ← imports from _elements as needed
```

A `scenes.js` might look like:

```js
import { startBouncers, stopBouncers } from '../_elements/bouncers.js';
import { startScope, stopScope }       from '../_elements/oscilloscope.js';

export const scenes = [
    {
        end_time: 10.081, // auto-advance at 10.081s into the track
        enter() { startBouncers({ images: ['fox.png'], maxWidth: 200 }); },
        exit()  { stopBouncers(); }
    },
    {
        end_time: null,   // manual advance only
        enter() { startScope({ color: '#0f0', lineWidth: 2 }); },
        exit()  { stopScope(); }
    }
];
```