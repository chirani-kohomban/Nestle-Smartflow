<?php
/**
 * Update Inventory API
 * POST /update_inventory.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['inventory_id']) || !isset($input['new_stock']) || empty($input['reason'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: inventory_id, new_stock, reason']);
    closeDatabase($conn);
    exit();
}

$inventory_id = intval($input['inventory_id']);
$new_stock = intval($input['new_stock']);
$reason = trim($input['reason']);

// Validate new_stock is not negative
if ($new_stock < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Stock quantity cannot be negative']);
    closeDatabase($conn);
    exit();
}

// Fetch current inventory records
$stmt = $conn->prepare('
    SELECT id, current_stock, max_stock, min_stock, product_id, unit
    FROM inventory
    WHERE id = ?
');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    closeDatabase($conn);
    exit();
}

$stmt->bind_param('i', $inventory_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Inventory record not found']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

$inventory = $result->fetch_assoc();
$stmt->close();

$old_stock = intval($inventory['current_stock']);
$max_stock = intval($inventory['max_stock']);
$min_stock = intval($inventory['min_stock']);

// Validate stock is within bounds
if ($new_stock > $max_stock) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Stock quantity exceeds maximum allowed: ' . $max_stock,
        'max_stock' => $max_stock,
        'attempted_stock' => $new_stock
    ]);
    closeDatabase($conn);
    exit();
}

// Update inventory
$update_stmt = $conn->prepare('
    UPDATE inventory
    SET current_stock = ?, last_updated = NOW()
    WHERE id = ?
');

if (!$update_stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    closeDatabase($conn);
    exit();
}

$update_stmt->bind_param('ii', $new_stock, $inventory_id);

if (!$update_stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update inventory']);
    $update_stmt->close();
    closeDatabase($conn);
    exit();
}

$update_stmt->close();

// Log inventory change (optional - for audit trail)
$log_stmt = $conn->prepare('
    INSERT INTO inventory_audit_log (inventory_id, old_stock, new_stock, reason, changed_at)
    VALUES (?, ?, ?, ?, NOW())
');

$log_created = false;
if ($log_stmt) {
    $log_stmt->bind_param('iiis', $inventory_id, $old_stock, $new_stock, $reason);
    if ($log_stmt->execute()) {
        $log_created = true;
    }
    $log_stmt->close();
}

// Determine stock status
$stock_status = 'Normal';
if ($new_stock <= $min_stock) {
    $stock_status = 'Low Stock';
} elseif ($new_stock >= $max_stock) {
    $stock_status = 'High Stock';
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Inventory updated successfully',
    'inventory_id' => $inventory_id,
    'old_stock' => $old_stock,
    'new_stock' => $new_stock,
    'change' => ($new_stock - $old_stock),
    'reason' => $reason,
    'stock_status' => $stock_status,
    'unit' => $inventory['unit'],
    'audit_logged' => $log_created,
    'timestamp' => date('c')
]);

closeDatabase($conn);
?>