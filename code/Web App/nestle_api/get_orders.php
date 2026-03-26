<?php
/**
 * Get Orders API
 * GET /get_orders.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$hasUserId = columnExists($conn, 'orders', 'user_id');
$hasOrderId = columnExists($conn, 'orders', 'order_id');
$hasRetailerName = columnExists($conn, 'orders', 'retailer_name');
$hasTotalAmount = columnExists($conn, 'orders', 'total_amount');
$hasPaymentMethod = columnExists($conn, 'orders', 'payment_method');
$hasUpdatedAt = columnExists($conn, 'orders', 'updated_at');

$query = 'SELECT 
    o.id,
    ' . ($hasOrderId ? 'o.order_id' : "CONCAT('ORD-', o.id)") . ' AS order_id,
    ' . ($hasUserId ? 'o.user_id' : '0') . ' AS user_id,
    ' . ($hasUserId ? 'COALESCE(u.username, o.retailer_name, \'Retailer\')' : ($hasRetailerName ? 'o.retailer_name' : "'Retailer'")) . ' AS username,
    ' . ($hasUserId ? 'COALESCE(u.email, \'\')' : "''") . ' AS email,
    ' . ($hasTotalAmount ? 'o.total_amount' : '0') . ' AS total_amount,
    o.status,
    ' . ($hasPaymentMethod ? 'o.payment_method' : "''") . ' AS payment_method,
    o.created_at,
    ' . ($hasUpdatedAt ? 'o.updated_at' : 'o.created_at') . ' AS updated_at
FROM orders o
' . ($hasUserId ? 'LEFT JOIN users u ON o.user_id = u.id' : '') . '
WHERE 1=1';

$params = [];
$types = '';

if (!empty($status)) {
    $query .= ' AND o.status = ?';
    $params[] = $status;
    $types .= 's';
}

if ($user_id > 0) {
    if ($hasUserId) {
        $query .= ' AND o.user_id = ?';
        $params[] = $user_id;
        $types .= 'i';
    }
}

$query .= ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
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

$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = [
        'id' => intval($row['id']),
        'order_id' => $row['order_id'],
        'user_id' => intval($row['user_id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'total_amount' => floatval($row['total_amount']),
        'status' => $row['status'],
        'payment_method' => $row['payment_method'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $orders,
    'count' => count($orders)
]);

$stmt->close();
closeDatabase($conn);
?>