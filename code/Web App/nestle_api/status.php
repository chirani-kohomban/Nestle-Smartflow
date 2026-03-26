<?php
/**
 * System status API
 * GET /status.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

function getCount(mysqli $conn, string $table): int
{
    if (!tableExists($conn, $table)) {
        return 0;
    }

    $result = $conn->query("SELECT COUNT(*) AS total FROM {$table}");
    if (!$result) {
        return 0;
    }

    $row = $result->fetch_assoc();
    return intval($row['total'] ?? 0);
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Nestle SmartFlow API is running',
    'server' => 'xampp-apache',
    'database' => DB_NAME,
    'users' => getCount($conn, 'users'),
    'products' => getCount($conn, 'products'),
    'orders' => getCount($conn, 'orders'),
    'inventory' => tableExists($conn, 'inventory')
        ? getCount($conn, 'inventory')
        : getCount($conn, 'warehouse_inventory'),
    'shipments' => getCount($conn, 'shipments'),
    'timestamp' => date('c')
]);

closeDatabase($conn);
?>
