(() => {
    const audio     = document.getElementById('audio');
    const btnPlay   = document.getElementById('btn-play');
    const btnStop   = document.getElementById('btn-stop');
    const btnNext   = document.getElementById('btn-next');
    const titleEl   = document.getElementById('track-title');
    const artistEl  = document.getElementById('track-artist');
    const fillEl    = document.getElementById('progress-fill');
    const statusEl  = document.getElementById('status');

    const API = 'api/tracks.php';
    const STREAM = 'api/stream.php';

    let currentId = null;

    function setStatus(msg) { statusEl.textContent = msg; }

    function setTrack(track) {
        currentId = track.id;
        titleEl.textContent  = track.title  || track.filename;
        artistEl.textContent = track.artist || '';
        audio.src = `${STREAM}?id=${track.id}`;
        fillEl.style.width = '0%';
    }

    async function loadRandom(autoplay = false) {
        setStatus('Loading...');
        try {
            const url = currentId ? `${API}?action=random&exclude=${currentId}` : `${API}?action=random`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('No tracks available');
            const track = await res.json();
            setTrack(track);
            if (autoplay) {
                await audio.play();
                btnPlay.classList.add('active');
            }
            setStatus('');
        } catch (e) {
            setStatus(e.message);
        }
    }

    btnPlay.addEventListener('click', async () => {
        if (!currentId) {
            await loadRandom(true);
            return;
        }
        if (audio.paused) {
            await audio.play();
            btnPlay.classList.add('active');
        } else {
            audio.pause();
            btnPlay.classList.remove('active');
        }
    });

    btnStop.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        fillEl.style.width = '0%';
        btnPlay.classList.remove('active');
    });

    btnNext.addEventListener('click', () => {
        const wasPlaying = !audio.paused;
        loadRandom(wasPlaying);
    });

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        fillEl.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    });

    audio.addEventListener('ended', () => {
        btnPlay.classList.remove('active');
        loadRandom(true);
    });

    audio.addEventListener('error', () => {
        setStatus('Error loading track — try Next');
        btnPlay.classList.remove('active');
    });

    // Load a track on page ready (don't autoplay — browsers block it without interaction)
    loadRandom(false);
})();
