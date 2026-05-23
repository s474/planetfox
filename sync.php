<?php
/**
 * sync.php — scan the music folder and upsert tracks into the DB.
 *
 * Run from CLI:  php sync.php
 * Run from browser: https://yoursite.com/sync.php?token=your_secret_token
 *
 * Set SYNC_TOKEN to a secret string to protect browser access.
 * Leave empty to disable browser access entirely.
 */
define('SYNC_TOKEN', '');

require_once __DIR__ . '/config.php';

// --- Auth check when run from browser ---
if (php_sapi_name() !== 'cli') {
    if (SYNC_TOKEN === '' || ($_GET['token'] ?? '') !== SYNC_TOKEN) {
        http_response_code(403);
        exit('Forbidden');
    }
}

$extensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac'];

if (!is_dir(MUSIC_DIR)) {
    die('Music directory not found: ' . MUSIC_DIR . "\n");
}

$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(MUSIC_DIR));

$found   = 0;
$added   = 0;
$skipped = 0;

$pdo = db();

$insert = $pdo->prepare('
    INSERT INTO tracks (filename, title, artist)
    VALUES (:filename, :title, :artist)
    ON DUPLICATE KEY UPDATE filename = filename
');

foreach ($files as $file) {
    if (!$file->isFile()) continue;
    $ext = strtolower($file->getExtension());
    if (!in_array($ext, $extensions, true)) continue;

    $found++;
    // Store path relative to MUSIC_DIR so the server path isn't baked in
    $relative = ltrim(str_replace(MUSIC_DIR, '', $file->getPathname()), '/\\');

    // Try to extract title/artist from filename as a fallback
    $basename = pathinfo($file->getFilename(), PATHINFO_FILENAME);
    $title    = $basename;
    $artist   = null;

    // Common "Artist - Title" filename convention
    if (str_contains($basename, ' - ')) {
        [$artist, $title] = explode(' - ', $basename, 2);
        $artist = trim($artist);
        $title  = trim($title);
    }

    $insert->execute([':filename' => $relative, ':title' => $title, ':artist' => $artist]);

    if ($insert->rowCount() > 0) {
        $added++;
        echo "  Added:   $relative\n";
    } else {
        $skipped++;
        echo "  Exists:  $relative\n";
    }
}

echo "\nDone. Found: $found  Added: $added  Already in DB: $skipped\n";
