<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planet Fox — Music Player</title>
<link rel="stylesheet" href="player.css">
</head>
<body>

<div class="player">
    <h1>Planet Fox Radio</h1>

    <div class="now-playing">
        <div class="track-title" id="track-title">—</div>
        <div class="track-artist" id="track-artist"></div>
    </div>

    <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
    </div>

    <div class="controls">
        <button class="btn" id="btn-play">&#9654; Play</button>
        <button class="btn" id="btn-stop">&#9632; Stop</button>
        <button class="btn" id="btn-next">&#9197; Next</button>
    </div>

    <div class="status" id="status"></div>
</div>

<audio id="audio" preload="metadata"></audio>

<script src="player.js"></script>
</body>
</html>
