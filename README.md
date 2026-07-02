# Planet Fox

A LAMP-stack music player and live performance visual system. Each track has its own animated web page — a "web video" — that can be projected on stage as a backdrop.

---

## Requirements

- PHP 8.0+
- MySQL 5.7+ / MariaDB
- A web server (Apache/Nginx) with `mod_rewrite` or equivalent
- Audio files in mp3, wav, m4a, ogg, or flac format

---

## Setup

### 1. Database

Create the tables in your MySQL database:

```sql
CREATE TABLE tracks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    filename    VARCHAR(255) NOT NULL UNIQUE,
    title       VARCHAR(255),
    artist      VARCHAR(255),
    duration    INT,
    votes_up    INT NOT NULL DEFAULT 0,
    votes_down  INT NOT NULL DEFAULT 0,
    play_count  INT NOT NULL DEFAULT 0,
    bpm         FLOAT NULL,
    beat_offset FLOAT NULL DEFAULT 0,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Configuration

Edit `config.php` and set your database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

`MUSIC_DIR` defaults to a `music/` folder inside the project root. Put your audio files there.

### 3. Add music files

Drop your mp3/wav/m4a/ogg/flac files into the `music/` folder, then run the sync script to register them in the database:

```bash
php sync.php
```

Or from a browser (set a `SYNC_TOKEN` in `sync.php` first for security):

```
https://yoursite.com/sync.php?token=your_secret_token
```

The sync script reads `Artist - Title` from filenames automatically. Run it again whenever you add new tracks — existing tracks are left unchanged.

### 4. BPM and beat offset (optional)

For beat-synced visuals, update each track's BPM and beat offset in the database:

```sql
UPDATE tracks SET bpm = 128, beat_offset = 0.5 WHERE id = 4;
```

`beat_offset` is the number of seconds before the first beat in the track.

---

## Music Player

Visit `/player/` for the standalone player, or `/` for the main site with the player embedded.

**Controls:** Play / Stop / Next (random)

To load a specific track on page load, pass its database ID in the URL:

```
/player/?track=5
```

---

## Track Visual Pages

Each track has an animated visual page at `/pages/track-{id}/`.

### Keyboard controls

| Key | Action |
|---|---|
| `Space` | Start/stop audio (normal mode) / next scene (perf mode) |
| `→` or `→` Arrow | Next scene |
| `←` Arrow / Backspace | Previous scene |
| `1`–`9` | Jump directly to scene number |
| `F` | Toggle fullscreen |
| `H` | Hide/show the scene overlay |

### Performance mode

Add `?perf=1` to the URL to enable performance mode:

```
/pages/track-4/?perf=1
```

In performance mode:
- Audio comes from an external source (PA, DAW, etc.)
- The page listens via the microphone/line input and starts scene 1 automatically when it detects sound
- Spacebar manually advances scenes
- The browser will ask for microphone permission the first time

---

## Creating a new track page

### 1. Create the folder

```
pages/track-{id}/
  index.html
  scenes.js
```

### 2. index.html

Copy from an existing track and change `TRACK_ID`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planet Fox — Track 7</title>
<link rel="stylesheet" href="../_base.css">
</head>
<body>
<script type="module">
    import { init }   from '../_base.js';
    import { scenes } from './scenes.js';

    const TRACK_ID = 7;
    const API      = '../../player/api/tracks.php';
    const STREAM   = `../../player/api/stream.php?id=${TRACK_ID}`;

    const res   = await fetch(`${API}?action=play&id=${TRACK_ID}`);
    const track = await res.json();

    init(scenes, {
        audioSrc:    STREAM,
        bpm:         track.bpm,
        beat_offset: track.beat_offset,
        title:       track.title,
    });
</script>
</body>
</html>
```

### 3. scenes.js

Import whichever elements you need and define the `scenes` array:

```js
import { startBouncers, stopBouncers } from '../_elements/bouncers.js';
import { startPulse,    stopPulse    } from '../_elements/pulse.js';

export const scenes = [
    {
        end_time: 32.5,   // auto-advance at 32.5 seconds into the track
        enter() {
            startPulse({ text: 'PLANET FOX', colors: ['#1a003a', '#003a1a'] });
        },
        exit() { stopPulse(); },
    },
    {
        end_time: null,   // manual advance only (spacebar / arrow key)
        enter() {
            startBouncers({ images: ['../../holding_page/WELCOME/spider1.gif'] });
        },
        exit() { stopBouncers(); },
    },
];
```

`end_time` is an absolute position in the track in seconds. The scene engine calculates the correct delay from `audio.currentTime` so beat_offset is automatically accounted for. Set to `null` for manual-only scenes.

---

## Available elements

All elements live in `pages/_elements/` and are imported as ES modules.

### bouncers.js
Bouncing images that ricochet around the screen.

```js
import { startBouncers, stopBouncers } from '../_elements/bouncers.js';

startBouncers({
    images:      ['../../path/to/image.gif'],  // array of src strings
    minWidth:    60,      // minimum image width in px
    maxWidth:    300,     // maximum image width in px
    randomizeMs: 66,      // interval to randomise sizes (0 to disable)
    syncBpm:     false,   // true = resize on each beat instead of timer
});
```

### pulse.js
Full-screen colour wash with large drifting text.

```js
import { startPulse, stopPulse } from '../_elements/pulse.js';

startPulse({
    text:      'PLANET FOX',
    colors:    ['#1a003a', '#003a1a', '#3a001a', '#00183a'],  // cycles as background
    textColor: 'rgba(255,255,255,0.12)',
});
```

### strobe.js
Flashes the screen black and white. Requires `bpm` set in the database.

```js
import { startStrobe, stopStrobe } from '../_elements/strobe.js';

startStrobe({
    flashesPerBeat: 2,   // flashes per beat (2 = twice per beat)
    flashDuration:  60,  // how long each flash stays white in ms
});
```

### scope.js
Canvas oscilloscope showing the audio waveform. Requires audio to be playing.

```js
import { startScope, stopScope } from '../_elements/scope.js';

startScope({
    color:     '#00ff00',
    lineWidth: 2,
});
```

### particles.js
Psychedelic particle system with rotational symmetry, colour cycling, and optional image slideshow.

```js
import { startParticles, stopParticles } from '../_elements/particles.js';

startParticles({
    count:             180,    // number of particles
    symmetry:          6,      // rotational symmetry (6 = hexagonal mandala)
    trailAlpha:        0.06,   // trail fade speed (lower = longer trails)
    scale:             1,      // particle size multiplier
    slideshowImages:   ['../../images/photo1.jpg', '../../images/photo2.jpg'],
    slideshowInterval: 3000,   // ms between image changes
    imageRotateSpeed:  0.003,  // radians per frame
    imagePulseSpeed:   0.008,  // brightness oscillation speed
});
```

### video.js
Plays mp4 video clips fullscreen, muted.

```js
import { startVideo, stopVideo } from '../_elements/video.js';

startVideo({
    clips:        ['../../video/clip1.mp4', '../../video/clip2.mp4'],
    playbackRate: 1,      // 0.5 = half speed, 2 = double speed
    loop:         true,   // loop single clip / cycle multiple clips indefinitely
    fit:          'cover', // 'cover' | 'contain' | 'fill'
    opacity:      1,
});
```

---

## File structure

```
/
├── config.php                  Database credentials and music folder path
├── sync.php                    Scan music/ folder and populate database
├── index.html                  Main site (player + bouncers)
├── music/                      Audio files go here
├── images/                     Images for visual pages
├── videos/                     Video clips for visual pages
├── holding_page/               Original holding page assets
│   └── WELCOME/                Animated GIFs used in visual pages
├── player/
│   ├── index.php               Standalone music player
│   ├── player.js               Player frontend logic
│   ├── player.css              Player styles
│   └── api/
│       ├── tracks.php          JSON API — random, list, play, vote
│       └── stream.php          Audio file streaming with range support
└── pages/
    ├── _base.js                Scene engine, keyboard, fullscreen, perf mode
    ├── _base.css               Base styles for all track pages
    ├── _elements/
    │   ├── bouncers.js
    │   ├── particles.js
    │   ├── pulse.js
    │   ├── scope.js
    │   ├── strobe.js
    │   └── video.js
    ├── track-2/
    ├── track-4/
    └── track-13/
```