<?php
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache');

$method = $_SERVER['REQUEST_METHOD'];

// POST: vote or record play
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);

    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Invalid id']); exit; }

    $action = $body['action'] ?? '';

    if ($action === 'vote') {
        $direction = $body['vote'] ?? '';
        if (!in_array($direction, ['up', 'down'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'vote must be "up" or "down"']);
            exit;
        }
        $col = $direction === 'up' ? 'votes_up' : 'votes_down';
        db()->prepare("UPDATE tracks SET $col = $col + 1 WHERE id = ?")->execute([$id]);

        $row = db()->prepare('SELECT votes_up, votes_down FROM tracks WHERE id = ?');
        $row->execute([$id]);
        echo json_encode($row->fetch());
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Unknown action']);
    exit;
}

// GET
$action = $_GET['action'] ?? 'random';

if ($action === 'random') {
    $exclude = filter_input(INPUT_GET, 'exclude', FILTER_VALIDATE_INT);
    if ($exclude) {
        $stmt = db()->prepare('SELECT id, filename, title, artist FROM tracks WHERE id != ? ORDER BY RAND() LIMIT 1');
        $stmt->execute([$exclude]);
    } else {
        $stmt = db()->query('SELECT id, filename, title, artist FROM tracks ORDER BY RAND() LIMIT 1');
    }
    $track = $stmt->fetch();
    if (!$track) { http_response_code(404); echo json_encode(['error' => 'No tracks']); exit; }
    echo json_encode($track);
    exit;
}

if ($action === 'list') {
    $stmt = db()->query('
        SELECT id, filename, title, artist, votes_up, votes_down, play_count
        FROM tracks
        ORDER BY title ASC
    ');
    echo json_encode($stmt->fetchAll());
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action']);
