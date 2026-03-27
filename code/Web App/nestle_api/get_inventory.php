<?php
/**
 * Get Inventory API
 * GET /get_inventory.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$zone = isset($_GET['zone']) ? trim($_GET['zone']) : '';
$low_stock = isset($_GET['low_stock']) ? true : false;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$productNameColumn = columnExists($conn, 'products', 'name') ? 'p.name' : 'p.product_name';
$skuColumn = columnExists($conn, 'products', 'sku') ? 'p.sku' : "''";
$categoryColumn = columnExists($conn, 'products', 'category') ? 'p.category' : "''";

if (tableExists($conn, 'inventory')) {
    $query = "SELECT 
        i.id,
        i.product_id,
        {$productNameColumn} AS product_name,
        {$skuColumn} AS sku,
        {$categoryColumn} AS category,
        i.zone,
        i.current_stock,
        i.min_stock,
        i.max_stock,
        i.unit,
        i.last_updated
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE 1=1";
} else {
    $query = "SELECT 
        wi.id,
        wi.product_id,
        {$productNameColumn} AS product_name,
        {$skuColumn} AS sku,
        {$categoryColumn} AS category,
        'Warehouse' AS zone,
        wi.quantity AS current_stock,
        0 AS min_stock,
        0 AS max_stock,
        'units' AS unit,
        wi.last_updated
    FROM warehouse_inventory wi
    JOIN products p ON wi.product_id = p.id
    WHERE 1=1";
}

$params = [];
$types = '';

if (!empty($zone)) {
    if (tableExists($conn, 'inventory')) {
        $query .= ' AND i.zone = ?';
        $params[] = $zone;
        $types .= 's';
    }
}

if ($low_stock) {
    if (tableExists($conn, 'inventory')) {
        $query .= ' AND i.current_stock <= i.min_stock';
    }
}

$orderByName = columnExists($conn, 'products', 'name') ? 'p.name' : 'p.product_name';
$query .= ' ORDER BY ' . (tableExists($conn, 'inventory') ? 'zone' : 'product_name') . ', ' . $orderByName . ' ASC LIMIT ? OFFSET ?';
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

$inventory = [];
while ($row = $result->fetch_assoc()) {
    $inventory[] = [
        'id' => intval($row['id']),
        'product_id' => intval($row['product_id']),
        'product_name' => $row['product_name'],
        'sku' => $row['sku'],
        'category' => $row['category'],
        'zone' => $row['zone'],
        'current_stock' => intval($row['current_stock']),
        'min_stock' => intval($row['min_stock']),
        'max_stock' => intval($row['max_stock']),
        'unit' => $row['unit'],
        'last_updated' => $row['last_updated']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $inventory,
    'count' => count($inventory)
]);

$stmt->close();
closeDatabase($conn);
?>