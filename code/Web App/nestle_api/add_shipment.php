<?php
/**
 * Add Shipment API
 * POST /add_shipment.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['shipment_id', 'type', 'supplier'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
        closeDatabase($conn);
        exit();
    }
}

$shipment_id = trim($input['shipment_id']);
$type = trim($input['type']);
$supplier = trim($input['supplier']);
$tracking_number = isset($input['tracking_number']) ? trim($input['tracking_number']) : '';
$expected_date = isset($input['expected_date']) ? trim($input['expected_date']) : null;
$status = isset($input['status']) ? trim($input['status']) : 'Pending';
$notes = isset($input['notes']) ? trim($input['notes']) : '';

// Validate type
if (!in_array($type, ['Incoming', 'Outgoing'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Type must be Incoming or Outgoing']);
    closeDatabase($conn);
    exit();
}

// Check if shipment already exists
$stmt = $conn->prepare('SELECT id FROM shipments WHERE shipment_id = ? LIMIT 1');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    closeDatabase($conn);
    exit();
}

$stmt->bind_param('s', $shipment_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Shipment already exists']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

$stmt->close();

// Insert shipment
$stmt = $conn->prepare('
    INSERT INTO shipments 
    (shipment_id, type, supplier, tracking_number, expected_date, status, notes, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    closeDatabase($conn);
    exit();
}

$stmt->bind_param('ssssss', $shipment_id, $type, $supplier, $tracking_number, $expected_date, $status, $notes);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create shipment']);
    $stmt->close();
    closeDatabase($conn);
    exit();
}

$shipment_record_id = $stmt->insert_id;

// Handle items if provided
$item_count = 0;
if (isset($input['items']) && is_array($input['items'])) {
    $item_stmt = $conn->prepare('
        INSERT INTO shipment_items (shipment_id, product_id, sku, quantity, received_quantity)
        VALUES (?, ?, ?, ?, 0)
    ');

    if ($item_stmt) {
        foreach ($input['items'] as $item) {
            if (!empty($item['product_id']) && !empty($item['quantity'])) {
                $product_id = intval($item['product_id']);
                $sku = isset($item['sku']) ? trim($item['sku']) : '';
                $quantity = intval($item['quantity']);

                $item_stmt->bind_param('iisi', $shipment_record_id, $product_id, $sku, $quantity);
                
                if ($item_stmt->execute()) {
                    $item_count++;
                }
            }
        }
        $item_stmt->close();
    }
}

$stmt->close();

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Shipment created successfully',
    'shipment_id' => intval($shipment_record_id),
    'shipment_number' => $shipment_id,
    'items_added' => $item_count
]);

closeDatabase($conn);
?>