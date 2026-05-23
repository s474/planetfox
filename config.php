<?php
define('DB_HOST', 'secret');
define('DB_NAME', 'secret');
define('DB_USER', 'secret');
define('DB_PASS', 'secret');

// Absolute path to the folder containing your audio files
define('MUSIC_DIR', __DIR__ . '/music');

// Web-accessible path prefix used to build stream URLs (adjust if site is in a subdirectory)
define('BASE_PATH', '');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }
    return $pdo;
}
