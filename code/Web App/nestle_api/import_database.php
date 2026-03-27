<?php
/**
 * Nestle SmartFlow - Database Import Tool
 * This tool imports the database schema using PHP/MySQL
 */

// Database configuration
$dbHost = 'localhost';
$dbUser = 'root';
$dbPassword = ''; // Change if MySQL has password
$dbName = 'nestle_smartflow';

// Connect to MySQL (without selecting database first)
$conn = new mysqli($dbHost, $dbUser, $dbPassword);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Read the SQL file
$sqlFile = __DIR__ . '/nestle_smartflow_mysql.sql';

if (!file_exists($sqlFile)) {
    die("Error: nestle_smartflow_mysql.sql not found in " . __DIR__);
}

$sqlContent = file_get_contents($sqlFile);

// Split by GO statements (MySQL uses ; instead)
$sqlStatements = explode("GO", $sqlContent);

$successCount = 0;
$errorCount = 0;
$errors = [];

echo "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Nestle SmartFlow - Database Import</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .status {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .log {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            border-radius: 5px;
            max-height: 400px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.6;
        }
        .log-line {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .log-success { color: #28a745; }
        .log-error { color: #dc3545; }
        .log-info { color: #0069d9; }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        button {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        button:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🏭 Nestle SmartFlow - Database Import Tool</h1>";

// Process SQL statements
foreach ($sqlStatements as $index => $statement) {
    $statement = trim($statement);
    
    // Skip empty statements and comments
    if (empty($statement) || substr(trim($statement), 0, 2) === '--') {
        continue;
    }
    
    // Remove leading/trailing whitespace and comments
    $statement = preg_replace('/--.*?$/m', '', $statement);
    $statement = trim($statement);
    
    if (empty($statement)) {
        continue;
    }
    
    // Execute statement
    if ($conn->multi_query($statement . ";")) {
        // Clear any previous results
        while ($conn->more_results()) {
            $conn->next_result();
        }
        $successCount++;
        echo "<div class='log-line'><span class='log-success'>✓</span> Statement " . ($index + 1) . " executed successfully</div>";
    } else {
        $errorCount++;
        $errorMsg = $conn->error;
        $errors[] = $errorMsg;
        if (strpos($errorMsg, 'already exists') === false && 
            strpos($errorMsg, 'Duplicate') === false &&
            strpos($errorMsg, 'DROP TABLE') === false) {
            echo "<div class='log-line'><span class='log-error'>✗</span> Statement " . ($index + 1) . " failed: " . htmlspecialchars($errorMsg) . "</div>";
        } else {
            echo "<div class='log-line'><span class='log-info'>ℹ</span> Statement " . ($index + 1) . ": " . htmlspecialchars($errorMsg) . " (This is normal)</div>";
        }
    }
}

// Verify database and tables
echo "</div>";
echo "<h2>Import Summary</h2>";

$verification = [];
$verifyConn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);

if (!$verifyConn->connect_error) {
    // Check tables
    $result = $verifyConn->query("SHOW TABLES");
    $tableCount = $result ? $result->num_rows : 0;
    
    // Check data
    $usersResult = $verifyConn->query("SELECT COUNT(*) as count FROM users");
    $usersCount = $usersResult ? $usersResult->fetch_assoc()['count'] : 0;
    
    $productsResult = $verifyConn->query("SELECT COUNT(*) as count FROM products");
    $productsCount = $productsResult ? $productsResult->fetch_assoc()['count'] : 0;
    
    $ordersResult = $verifyConn->query("SELECT COUNT(*) as count FROM orders");
    $ordersCount = $ordersResult ? $ordersResult->fetch_assoc()['count'] : 0;
    
    echo "<div class='stats'>
        <div class='stat-card'>
            <div class='stat-number'>$tableCount</div>
            <div class='stat-label'>Tables Created</div>
        </div>
        <div class='stat-card'>
            <div class='stat-number'>$usersCount</div>
            <div class='stat-label'>Users</div>
        </div>
        <div class='stat-card'>
            <div class='stat-number'>$productsCount</div>
            <div class='stat-label'>Products</div>
        </div>
    </div>";
    
    if ($tableCount >= 10) {
        echo "<div class='status success'>
            <strong>✓ SUCCESS</strong><br>
            Database imported successfully!<br>
            Tables: $tableCount | Users: $usersCount | Products: $productsCount
        </div>";
    } else {
        echo "<div class='status error'>
            <strong>⚠ Partial Import</strong><br>
            Some tables may not have been created. Check the log above for errors.
        </div>";
    }
} else {
    echo "<div class='status error'>
        <strong>✗ Verification Failed</strong><br>
        Could not connect to database: " . $verifyConn->connect_error . "
    </div>";
}

// Display database details
echo "<h2>Database Details</h2>";
echo "<div class='status info'>
    <strong>Database Name:</strong> $dbName<br>
    <strong>Host:</strong> $dbHost<br>
    <strong>User:</strong> $dbUser<br>
    <strong>Tables:</strong> 11 (users, products, inventory, orders, order_items, shipments, shipment_items, stock_allocations, warehouse_inventory, inventory_audit_log)<br>
    <strong>Sample Data:</strong> 5 users, 3 products, 2 orders, sample inventory
</div>";

echo "<h2>Next Steps</h2>";
echo "<div class='status info'>
    <strong>1. Verify API Connection</strong><br>
    The PHP APIs in <code>nestle_api/</code> are now connected to your database.<br><br>
    
    <strong>2. Start PHP Server</strong><br>
    <code>cd nestle_api</code><br>
    <code>php -S localhost:8000</code><br><br>
    
    <strong>3. Open API Tester</strong><br>
    <code>http://localhost:8000/api_tester.html</code><br><br>
    
    <strong>4. Login Test</strong><br>
    Email: <code>admin@gmail.com</code><br>
    Password: <code>password123</code>
</div>";

echo "<h2>Default Users</h2>";
echo "<table style='width:100%; border-collapse: collapse;'>";
echo "<tr style='background:#f0f0f0;'><th style='padding:10px;border:1px solid #ddd;'>Username</th><th style='padding:10px;border:1px solid #ddd;'>Email</th><th style='padding:10px;border:1px solid #ddd;'>Role</th></tr>";

if (!$verifyConn->connect_error) {
    $users = $verifyConn->query("SELECT username, email, role FROM users LIMIT 5");
    if ($users) {
        while ($user = $users->fetch_assoc()) {
            echo "<tr><td style='padding:10px;border:1px solid #ddd;'>" . htmlspecialchars($user['username']) . "</td>" .
                 "<td style='padding:10px;border:1px solid #ddd;'>" . htmlspecialchars($user['email']) . "</td>" .
                 "<td style='padding:10px;border:1px solid #ddd;'>" . htmlspecialchars($user['role']) . "</td></tr>";
        }
    }
}

echo "</table>";

echo "</div></body></html>";

$conn->close();
if (isset($verifyConn)) $verifyConn->close();
?>
