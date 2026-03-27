<?php
/**
 * Get Shipments API
 * GET /get_shipments.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

if (!tableExists($conn, 'shipments')) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [],
        'count' => 0
    ]);
    closeDatabase($conn);
    exit();
}

if (columnExists($conn, 'shipments', 'shipment_id')) {
    $query = 'SELECT id, shipment_id, type, supplier, tracking_number, expected_date, notes, created_at FROM shipments ORDER BY created_at DESC LIMIT ? OFFSET ?';
} else {
    $productNameColumn = columnExists($conn, 'products', 'name') ? 'p.name' : 'p.product_name';
    $query = "SELECT 
        s.id,
        CONCAT('SHP-', s.id) AS shipment_id,
        'Incoming' AS type,
        {$productNameColumn} AS supplier,
        COALESCE(s.batch_number, '') AS tracking_number,
        s.expiry_date AS expected_date,
        CONCAT('Qty: ', s.quantity) AS notes,
        s.created_at
    FROM shipments s
    LEFT JOIN products p ON s.product_id = p.id
    ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
}

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    closeDatabase($conn);
    exit();
}

$stmt->bind_param('ii', $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();

$shipments = [];
while ($row = $result->fetch_assoc()) {
    $shipments[] = [
        'id' => intval($row['id']),
        'shipment_id' => $row['shipment_id'] ?? ('SHP-' . $row['id']),
        'type' => $row['type'] ?? 'Incoming',
        'supplier' => $row['supplier'] ?? '',
        'tracking_number' => $row['tracking_number'] ?? '',
        'expected_date' => $row['expected_date'] ?? null,
        'notes' => $row['notes'] ?? null,
        'created_at' => $row['created_at'] ?? null
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $shipments,
    'count' => count($shipments)
]);

$stmt->close();
closeDatabase($conn);
?>
