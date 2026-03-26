# API Integration Reference

**Complete reference for all PHP APIs integrated with Flutter Web application.**

## 📌 Base Configuration

```dart
// In lib/services/api_service.dart
static const String baseUrl = 'http://localhost:8000';
```

## 🔐 Authentication Endpoints

### 1. Login
**Endpoint**: `POST /login.php`

**Request Body**:
```json
{
  "email": "admin@gmail.com",
  "password": "password123"
}
```

**Success Response (200/201)**:
```json
{
  "success": true,
  "status": "success",
  "id": 1,
  "username": "admin",
  "email": "admin@gmail.com",
  "role": "admin"
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "status": "error",
  "message": "Invalid email or password"
}
```

**Flutter Usage**:
```dart
final response = await ApiService.login(
  email: 'admin@gmail.com',
  password: 'password123',
);
String role = response['role']; // Navigate based on role
```

---

### 2. Register
**Endpoint**: `POST /register.php`

**Request Body**:
```json
{
  "username": "newuser",
  "email": "newuser@gmail.com",
  "password": "password123",
  "full_name": "New User",
  "role": "retailer"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "status": "success",
  "user_id": 6,
  "message": "User registered successfully"
}
```

**Error Response (409)**:
```json
{
  "success": false,
  "status": "error",
  "message": "Email already exists"
}
```

**Flutter Usage**:
```dart
final response = await ApiService.register(
  username: 'newuser',
  email: 'newuser@gmail.com',
  password: 'password123',
  fullName: 'New User',
  role: 'retailer',
);
```

---

## 👥 User Endpoints

### 3. Get Users
**Endpoint**: `GET /get_users.php`

**Query Parameters**:
- `limit` (optional, default: 100) - Number of records to return
- `offset` (optional, default: 0) - Pagination offset
- `role` (optional) - Filter by role (admin, retailer, distributor, etc.)

**Example URLs**:
```
/get_users.php?limit=10
/get_users.php?limit=100&offset=0&role=admin
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": "success",
  "count": 5,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@gmail.com",
      "role": "admin",
      "created_at": "2024-01-15 10:30:00"
    },
    ...
  ]
}
```

**Flutter Usage**:
```dart
final response = await ApiService.getUsers(
  limit: 100,
  offset: 0,
  role: 'admin',
);
List users = response['data'] ?? [];
int count = response['count'] ?? 0;
```

---

## 🛍️ Product Endpoints

### 4. Get Products
**Endpoint**: `GET /get_products.php`

**Query Parameters**:
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)
- `category` (optional) - Filter by category

**Example URLs**:
```
/get_products.php?limit=100
/get_products.php?limit=100&category=Beverages
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": "success",
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Milo",
      "sku": "MIL001",
      "price": "350.00",
      "category": "Beverages",
      "description": "Chocolate beverage mix"
    },
    ...
  ]
}
```

**Flutter Usage**:
```dart
final response = await ApiService.getProducts(
  limit: 100,
  category: 'Beverages',
);
List<Product> products = (response['data'] ?? [])
    .map((json) => Product.fromJson(json))
    .toList();
```

---

## 📦 Inventory Endpoints

### 5. Get Inventory
**Endpoint**: `GET /get_inventory.php`

**Query Parameters**:
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)
- `zone` (optional) - Filter by zone (Zone A, Zone B, etc.)
- `low_stock` (optional) - Set to 'true' to show only low stock items

**Example URLs**:
```
/get_inventory.php?limit=100
/get_inventory.php?zone=Zone%20A&low_stock=true
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": "success",
  "count": 6,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Milo",
      "sku": "MIL001",
      "current_stock": 50,
      "min_stock": 10,
      "max_stock": 100,
      "zone": "Zone A",
      "last_updated": "2024-03-24 14:30:00"
    },
    ...
  ]
}
```

**Flutter Usage**:
```dart
final response = await ApiService.getInventory(
  limit: 100,
  zone: 'Zone A',
  lowStockOnly: true,
);
List<Inventory> inventory = (response['data'] ?? [])
    .map((json) => Inventory.fromJson(json))
    .toList();
```

---

### 6. Update Inventory
**Endpoint**: `POST /update_inventory.php`

**Request Body**:
```json
{
  "inventory_id": 1,
  "new_stock": 75,
  "reason": "Restock from supplier"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": "success",
  "message": "Inventory updated successfully",
  "old_stock": 50,
  "new_stock": 75,
  "change": 25,
  "stock_status": "Normal"
}
```

**Flutter Usage**:
```dart
final response = await ApiService.updateInventory(
  inventoryId: 1,
  newStock: 75,
  reason: 'Restock from supplier',
);
```

---

## 📋 Order Endpoints

### 7. Get Orders
**Endpoint**: `GET /get_orders.php`

**Query Parameters**:
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)
- `status` (optional) - Filter by status (Pending, Processing, Completed, Cancelled)
- `user_id` (optional) - Filter by user ID

**Example URLs**:
```
/get_orders.php?limit=50
/get_orders.php?status=Pending&user_id=3
```

**Success Response (200)**:
```json
{
  "success": true,
  "status": "success",
  "count": 2,
  "data": [
    {
      "order_id": 1,
      "user_id": 3,
      "username": "retailer1",
      "email": "retailer@gmail.com",
      "total_amount": "5000.00",
      "status": "Pending",
      "payment_method": "Cash",
      "created_at": "2024-03-24 10:15:00"
    },
    ...
  ]
}
```

**Flutter Usage**:
```dart
final response = await ApiService.getOrders(
  limit: 100,
  status: 'Pending',
  userId: 3,
);
List<Order> orders = (response['data'] ?? [])
    .map((json) => Order.fromJson(json))
    .toList();
```

---

## 🚚 Shipment Endpoints

### 8. Add Shipment
**Endpoint**: `POST /add_shipment.php`

**Request Body**:
```json
{
  "shipment_id": "SHIP001",
  "type": "Incoming",
  "supplier": "Nestle Factory",
  "tracking_number": "TRK123456",
  "expected_date": "2024-03-25",
  "notes": "Contains 10 cases of Milo",
  "items": [
    {
      "product_id": 1,
      "quantity": 100
    }
  ]
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "status": "success",
  "shipment_id": "SHIP001",
  "shipment_number": "SHP001",
  "message": "Shipment created successfully",
  "items_added": 1
}
```

**Flutter Usage**:
```dart
final response = await ApiService.addShipment(
  shipmentId: 'SHIP001',
  type: 'Incoming',
  supplier: 'Nestle Factory',
  trackingNumber: 'TRK123456',
  expectedDate: '2024-03-25',
  items: [
    {'product_id': 1, 'quantity': 100}
  ],
);
```

---

## 💳 Point of Sale Endpoints

### 9. Record Sale
**Endpoint**: `POST /record_sale.php`

**Request Body**:
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Milo",
      "price": "350.00",
      "quantity": 2
    },
    {
      "product_id": 2,
      "product_name": "Nescafe",
      "price": "450.00",
      "quantity": 1
    }
  ],
  "total": "1150.00",
  "payment_method": "Cash",
  "user_id": 4,
  "transaction_id": "TXN-1711270500000"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "status": "success",
  "message": "Sale recorded successfully",
  "order_id": 5,
  "transaction_id": "TXN-1711270500000",
  "items_recorded": 2,
  "total": "1150.00",
  "timestamp": "2024-03-24 15:48:20"
}
```

**Flutter Usage**:
```dart
final response = await ApiService.recordSale(
  items: [
    {
      'product_id': 1,
      'product_name': 'Milo',
      'price': 350.0,
      'quantity': 2,
    },
  ],
  total: 1150.0,
  paymentMethod: 'Cash',
  userId: 4,
  transactionId: 'TXN-${DateTime.now().millisecondsSinceEpoch}',
);
```

---

## 🏥 System Endpoints

### 10. Get API Status
**Endpoint**: `GET /status.php`

**Success Response (200)**:
```json
{
  "status": "success",
  "database": "connected",
  "users": 5,
  "products": 3,
  "orders": 2,
  "inventory": 6,
  "shipments": 2,
  "timestamp": "2024-03-24 16:00:00"
}
```

**Flutter Usage**:
```dart
final response = await ApiService.getApiStatus();
String dbStatus = response['database']; // "connected"
int userCount = response['users']; // 5
```

### 11. Check API Health
**Purpose**: Verify if API is accessible

**Success**: Returns HTTP 200  
**Failure**: Returns any other status or timeout

**Flutter Usage**:
```dart
bool isHealthy = await ApiService.checkApiHealth();
if (isHealthy) {
  print('API is running');
} else {
  print('API is unreachable');
}
```

---

## 🎯 Integration Examples

### Example 1: Admin Dashboard - Load Users

```dart
FutureBuilder<Map<String, dynamic>>(
  future: ApiService.getUsers(limit: 1000),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const LoadingWidget();
    }
    
    if (snapshot.hasError) {
      return ErrorWidget(
        message: snapshot.error.toString(),
        onRetry: () => setState(() {}),
      );
    }
    
    final response = snapshot.data ?? {};
    final users = (response['data'] as List)
        .map((json) => User.fromJson(json))
        .toList();
    
    return DataTable(
      columns: [...],
      rows: users.map((user) => DataRow(...)).toList(),
    );
  },
)
```

### Example 2: Cashier Dashboard - Process Sale

```dart
Future<void> _processSale() async {
  try {
    final response = await ApiService.recordSale(
      items: cartItems,
      total: cartTotal,
      paymentMethod: selectedMethod,
    );
    
    if (response['success'] == true) {
      showSuccessDialog('Order ID: ${response['order_id']}');
      clearCart();
    }
  } on ApiException catch (e) {
    showErrorDialog(e.message);
  }
}
```

### Example 3: Warehouse Dashboard - Update Stock

```dart
Future<void> _updateStock() async {
  try {
    final response = await ApiService.updateInventory(
      inventoryId: itemId,
      newStock: newStockValue,
      reason: 'Warehouse recount',
    );
    
    showSnackBar('Stock updated: ${response['old_stock']} → ${response['new_stock']}');
  } on ApiException catch (e) {
    showErrorSnackBar(e.message);
  }
}
```

---

## ⚠️ Error Handling

All endpoints may return errors. Always handle them:

```dart
try {
  final response = await ApiService.getRequest(endpoint);
  // Use response
} on ApiException catch (e) {
  print('API Error [${e.statusCode}]: ${e.message}');
  // Show user-friendly error message
} on TimeoutException catch (e) {
  print('Timeout: ${e.message}');
  // Show "Connection timeout" message
} catch (e) {
  print('Unknown Error: $e');
  // Show generic error message
}
```

---

## 📝 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | GET requests, updates |
| 201 | Created - Resource created | POST register, add shipment |
| 400 | Bad Request - Invalid input | Missing fields |
| 401 | Unauthorized - Invalid credentials | Wrong password, invalid token |
| 404 | Not Found - Resource doesn't exist | Searching for non-existent user |
| 409 | Conflict - Resource already exists | Duplicate email, duplicate shipment ID |
| 500 | Server Error - Internal error | Database connection failed |

---

## 🔗 API Dependencies by Dashboard

| Dashboard | Required APIs |
|-----------|---------------|
| Login | `/login.php` |
| Admin | `/get_users.php`, `/status.php` |
| Manager | `/get_products.php`, `/get_inventory.php`, `/get_orders.php` |
| Distributor | `/get_orders.php`, `/get_inventory.php` |
| Retailer | `/get_products.php`, (place_order - not yet implemented) |
| Cashier | `/get_products.php`, `/record_sale.php` |
| Warehouse | `/add_shipment.php`, `/update_inventory.php`, `/get_inventory.php` |

---

## 🔄 Data Flow

```
User Input
    ↓
Login Form → /login.php → Navigate by Role
    ↓
Dashboard Page
    ↓
FutureBuilder triggers API call
    ↓
ApiService.getRequest() or .postRequest()
    ↓
HTTP Client makes request to PHP API
    ↓
PHP processes request, queries MySQL
    ↓
Returns JSON response
    ↓
Flutter parses to Models
    ↓
Display in DataTable/GridView/ListView
    ↓
User can interact (update, delete, create)
    ↓
POST request sent to PHP
    ↓
Database updated, result returned
    ↓
UI refreshes with new data
```

---

**Last Updated**: 2026-03-24  
**Version**: 1.0  
**Status**: ✅ Production Ready
