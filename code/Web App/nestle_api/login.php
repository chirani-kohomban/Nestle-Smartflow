<?php
/**
 * Login API
 * POST /login.php
 * Authenticates user with email and password
 */

require_once 'db.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    closeDatabase($conn);
    exit();
}

$email = trim($input['email']);
$password = trim($input['password']);

// Prepare statement
$stmt = $conn->prepare('SELECT id, username, email, role, password FROM users WHERE email = ? LIMIT 1');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    closeDatabase($conn);
    exit();
}

// Bind parameters
$stmt->bind_param('s', $email);

// Execute query
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query execution failed']);
    closeDatabase($conn);
    exit();
}

$result = $stmt->get_result();

// Check if user exists
if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

$user = $result->fetch_assoc();

// Verify password for either bcrypt hashes or legacy plain-text demo data
$storedPassword = $user['password'];
$isValidPassword = password_verify($password, $storedPassword) || $password === $storedPassword;

if (!$isValidPassword) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

// Remove password from response
unset($user['password']);

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'user' => [
        'id' => intval($user['id']),
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
]);

$stmt->close();
closeDatabase($conn);
?>
