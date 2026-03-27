<?php
/**
 * Record Sale API
 * POST /record_sale.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['total']) || empty($input['payment_method']) || empty($input['items']) || !is_array($input['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: total, payment_method, items']);
    closeDatabase($conn);
    exit();
}

if (count($input['items']) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'At least one item is required']);
    closeDatabase($conn);
    exit();
}

$total = floatval($input['total']);
$payment_method = trim($input['payment_method']);
$user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
$transaction_id = isset($input['transaction_id']) ? trim($input['transaction_id']) : 'TXN_' . time();

// Validate payment method
if (!in_array($payment_method, ['Cash', 'Card', 'Check', 'Bank Transfer'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid payment method']);
    closeDatabase($conn);
    exit();
}

// Generate order ID
$order_id = 'ORD_' . date('YmdHis') . '_' . rand(1000, 9999);

// Start transaction
$conn->begin_transaction();

try {
    // Create order
    $stmt = $conn->prepare('
        INSERT INTO orders (order_id, user_id, total_amount, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ');

    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $status = 'Completed';
    $stmt->bind_param('ssdss', $order_id, $user_id, $total, $payment_method, $status);

    if (!$stmt->execute()) {
        throw new Exception('Insert order failed: ' . $stmt->error);
    }

    $order_db_id = $stmt->insert_id;
    $stmt->close();

    // Insert order items
    $item_stmt = $conn->prepare('
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
    ');

    if (!$item_stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $item_count = 0;
    foreach ($input['items'] as $item) {
        if (empty($item['product_id']) || empty($item['quantity'])) {
            continue;
        }

        $product_id = intval($item['product_id']);
        $product_name = isset($item['product_name']) ? trim($item['product_name']) : 'Unknown';
        $price = floatval($item['price'] ?? 0);
        $quantity = intval($item['quantity']);
        $subtotal = $price * $quantity;

        $item_stmt->bind_param('iisdid', $order_db_id, $product_id, $product_name, $price, $quantity, $subtotal);

        if ($item_stmt->execute()) {
            $item_count++;
        }
    }

    $item_stmt->close();

    // Commit transaction
    $conn->commit();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Sale recorded successfully',
        'sale_id' => intval($order_db_id),
        'order_id' => $order_id,
        'transaction_id' => $transaction_id,
        'items_recorded' => $item_count,
        'total' => $total,
        'timestamp' => date('c')
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Sale recording failed: ' . $e->getMessage()]);
}

closeDatabase($conn);
?>