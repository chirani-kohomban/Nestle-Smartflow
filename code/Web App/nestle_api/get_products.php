<?php
/**
 * Get Products API
 * GET /get_products.php
 */

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$nameColumn = columnExists($conn, 'products', 'name') ? 'name' : 'product_name';
$skuColumn = columnExists($conn, 'products', 'sku') ? 'sku' : "''";
$priceColumn = columnExists($conn, 'products', 'price') ? 'price' : '0';
$descriptionColumn = columnExists($conn, 'products', 'description') ? 'description' : "''";
$query = "SELECT id, {$nameColumn} AS name, {$skuColumn} AS sku, {$priceColumn} AS price, category, {$descriptionColumn} AS description FROM products WHERE 1=1";
$params = [];
$types = '';

if (!empty($category)) {
    $query .= ' AND category = ?';
    $params[] = $category;
    $types .= 's';
}

$query .= ' ORDER BY name ASC LIMIT ? OFFSET ?';
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

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = [
        'id' => intval($row['id']),
        'name' => $row['name'],
        'sku' => $row['sku'],
        'price' => floatval($row['price']),
        'category' => $row['category'],
        'description' => $row['description']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $products,
    'count' => count($products)
]);

$stmt->close();
closeDatabase($conn);
?>