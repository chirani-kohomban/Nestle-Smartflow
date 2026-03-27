<?php
/**
 * Database Connection Configuration
 * Connects to Nestle SmartFlow MySQL database
 */

// Database credentials
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASSWORD = '';
const DB_NAME = 'nestle_smartflow';

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set character set
$conn->set_charset('utf8mb4');

// Function to close database connection safely
function closeDatabase($conn) {
    if ($conn) {
        $conn->close();
    }
}

function tableExists(mysqli $conn, string $tableName): bool {
    $stmt = $conn->prepare(
        'SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
    );

    if (!$stmt) {
        return false;
    }

    $database = DB_NAME;
    $stmt->bind_param('ss', $database, $tableName);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    return intval($row['total'] ?? 0) > 0;
}

function columnExists(mysqli $conn, string $tableName, string $columnName): bool {
    $stmt = $conn->prepare(
        'SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?'
    );

    if (!$stmt) {
        return false;
    }

    $database = DB_NAME;
    $stmt->bind_param('sss', $database, $tableName, $columnName);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    return intval($row['total'] ?? 0) > 0;
}

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Set JSON response header globally
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
?>
