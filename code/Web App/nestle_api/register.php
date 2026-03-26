<?php
/**
 * Register API
 * POST /register.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$required = ['username', 'email', 'password'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => ucfirst($field) . ' is required']);
        closeDatabase($conn);
        exit();
    }
}

$username = trim($input['username']);
$email = trim($input['email']);
$password = trim($input['password']);
$full_name = trim($input['full_name'] ?? $username);
$role = strtolower(trim($input['role'] ?? ''));
$allowedRoles = ['admin', 'manager', 'distributor', 'cashier', 'warehouse_staff'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    closeDatabase($conn);
    exit();
}

if (empty($role) || !in_array($role, $allowedRoles, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid role selected']);
    closeDatabase($conn);
    exit();
}

// Check existing email
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    closeDatabase($conn);
    exit();
}

$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email already registered']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

$stmt->close();

$hash = password_hash($password, PASSWORD_BCRYPT);

if (columnExists($conn, 'users', 'full_name')) {
    $stmt = $conn->prepare('INSERT INTO users (full_name, username, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
} else {
    $stmt = $conn->prepare('INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())');
}

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    closeDatabase($conn);
    exit();
}

if (columnExists($conn, 'users', 'full_name')) {
    $stmt->bind_param('sssss', $full_name, $username, $email, $hash, $role);
} else {
    $stmt->bind_param('ssss', $username, $email, $hash, $role);
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Insert failed']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

$userId = $stmt->insert_id;

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Registration successful',
    'user_id' => intval($userId),
    'role' => $role
]);

$stmt->close();
closeDatabase($conn);
?>