<?php
require_once __DIR__ . '/../../config.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) { http_response_code(400); exit('Bad request'); }

$row = db()->prepare('SELECT filename FROM tracks WHERE id = ?');
$row->execute([$id]);
$track = $row->fetch();

if (!$track) { http_response_code(404); exit('Not found'); }

$path = MUSIC_DIR . '/' . $track['filename'];
if (!file_exists($path) || !is_readable($path)) {
    http_response_code(404);
    exit('File not found');
}

$mimeTypes = [
    'mp3'  => 'audio/mpeg',
    'wav'  => 'audio/wav',
    'm4a'  => 'audio/mp4',
    'ogg'  => 'audio/ogg',
    'flac' => 'audio/flac',
];
$ext  = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mime = $mimeTypes[$ext] ?? 'application/octet-stream';
$size = filesize($path);

// Increment play count (fire and forget — don't block streaming on failure)
try {
    db()->prepare('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?')->execute([$id]);
} catch (Exception $e) {}

// HTTP Range support — required for seeking in the browser audio element
$start = 0;
$end   = $size - 1;

if (isset($_SERVER['HTTP_RANGE'])) {
    preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $m);
    $start = (int) $m[1];
    $end   = isset($m[2]) && $m[2] !== '' ? (int) $m[2] : $size - 1;
    $end   = min($end, $size - 1);

    if ($start > $end || $start >= $size) {
        http_response_code(416);
        header("Content-Range: bytes */$size");
        exit;
    }

    http_response_code(206);
    header("Content-Range: bytes $start-$end/$size");
} else {
    http_response_code(200);
}

$length = $end - $start + 1;

header("Content-Type: $mime");
header("Content-Length: $length");
header('Accept-Ranges: bytes');
header('Cache-Control: no-cache');

$fp = fopen($path, 'rb');
fseek($fp, $start);

$remaining = $length;
while (!feof($fp) && $remaining > 0) {
    $chunk = min(8192, $remaining);
    echo fread($fp, $chunk);
    $remaining -= $chunk;
    flush();
}
fclose($fp);
