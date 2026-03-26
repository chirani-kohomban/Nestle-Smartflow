<?php
/**
 * Get Users API
 * GET /get_users.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$role = isset($_GET['role']) ? trim($_GET['role']) : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$query = 'SELECT id, username, email, role, created_at FROM users WHERE 1=1';
$params = [];
$types = '';

if (!empty($role)) {
    $query .= ' AND role = ?';
    $params[] = $role;
    $types .= 's';
}

$query .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
$params[] = $limit;
$params[] = $offset;
$types .= 'ii';

$stmt = $conn->prepare($query);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    closeDatabase($conn);
    exit();
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = [
        'id' => intval($row['id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'role' => $row['role'],
        'created_at' => $row['created_at']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $users,
    'count' => count($users)
]);

$stmt->close();
closeDatabase($conn);
?>