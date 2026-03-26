# 🏭 Nestle SmartFlow - Database Setup & API Testing Guide

## 📋 Quick Start (5 minutes)

### Step 1: Database Setup

**Option A: Import SQL File (Recommended)**
```bash
# Open MySQL/MariaDB and run:
mysql -u root -p < "d:\APIIT\Thushain\CC 2\Web App\NestleFlow_DB.sql"

# Or in MySQL console:
SOURCE "d:\APIIT\Thushain\CC 2\Web App\NestleFlow_DB.sql";
```

**Option B: Create Database Manually**
```sql
CREATE DATABASE nestle_smartflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nestle_smartflow;

-- Create tables (see schema below)
```

### Step 2: Verify PHP Server is Running
```bash
# Terminal should show:
# [Local Dev Server running at http://127.0.0.1:8000]
```

### Step 3: Access API Tester
1. Open **Google Chrome**
2. Go to: **http://localhost:8000/api_tester.html**
3. Use pre-filled examples to test each API

---

## 🧪 Testing Guide

### Test Sequence (Recommended Order)

#### 1. **Register New User** (Test Create)
- **Endpoint:** POST `/register.php`
- **Input:**
  - Username: `testuser`
  - Email: `testuser@test.com`
  - Password: `password123`
- **Expected Response:** 201 Created
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user_id": 5
  }
  ```

#### 2. **Login User** (Test Authentication)
- **Endpoint:** POST `/login.php`
- **Input:**
  - Email: `admin@nestle.com` or the user you just registered
  - Password: `password123` (or appropriate password)
- **Expected Response:** 200 OK
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "username": "admin",
      "email": "admin@nestle.com",
      "role": "admin"
    }
  }
  ```

#### 3. **Get Users** (Test Read)
- **Endpoint:** GET `/get_users.php`
- **Parameters:**
  - role: (optional) `admin`, `retailer`, `cashier`, etc.
  - limit: `10`
  - offset: `0`
- **Expected Response:** 200 OK
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@nestle.com",
        "role": "admin",
        "created_at": "2024-01-01 10:00:00"
      }
    ],
    "count": 1
  }
  ```

#### 4. **Get Products** (Test Read)
- **Endpoint:** GET `/get_products.php`
- **Parameters:**
  - category: (optional) `Beverages`, `Cereals`, etc.
  - limit: `10`
- **Expected Response:** 200 OK
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Nescafé Classic",
        "sku": "NEF-001",
        "price": 350.00,
        "category": "Beverages",
        "description": "Instant coffee"
      }
    ],
    "count": 1
  }
  ```

#### 5. **Get Inventory** (Test with JOINs)
- **Endpoint:** GET `/get_inventory.php`
- **Parameters:**
  - zone: (optional) `Zone A`, `Zone B`, etc.
  - low_stock: (checkbox) `true` to show only low stock items
  - limit: `10`
- **Expected Response:** 200 OK
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Nescafé Classic",
        "sku": "NEF-001",
        "category": "Beverages",
        "zone": "Zone A",
        "current_stock": 150,
        "min_stock": 50,
        "max_stock": 500,
        "unit": "boxes",
        "last_updated": "2024-03-24 10:00:00"
      }
    ],
    "count": 1
  }
  ```

#### 6. **Get Orders** (Test Read with Filters)
- **Endpoint:** GET `/get_orders.php`
- **Parameters:**
  - status: (optional) `Pending`, `Processing`, `Completed`
  - user_id: (optional) `1`
  - limit: `10`
- **Expected Response:** 200 OK
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "order_id": "ORD-20240101001",
        "user_id": 2,
        "username": "retailer1",
        "email": "retailer@example.com",
        "total_amount": 5000.00,
        "status": "Completed",
        "payment_method": "Cash",
        "created_at": "2024-01-01 10:00:00"
      }
    ],
    "count": 1
  }
  ```

#### 7. **Add Shipment** (Test Insert)
- **Endpoint:** POST `/add_shipment.php`
- **Input:**
  - shipment_id: `SHP-TEST-001`
  - type: `Incoming`
  - supplier: `Supplier Company`
  - tracking_number: `TRK-123456` (optional)
  - items: `[]` (optional array)
- **Expected Response:** 201 Created
  ```json
  {
    "success": true,
    "message": "Shipment created successfully",
    "shipment_id": 5,
    "shipment_number": "SHP-TEST-001",
    "items_added": 0
  }
  ```

#### 8. **Record Sale** (Test Complex Insert)
- **Endpoint:** POST `/record_sale.php`
- **Input:**
  - total: `5000.00`
  - payment_method: `Cash`
  - items: (JSON array)
    ```json
    [
      {
        "product_id": 1,
        "product_name": "Product A",
        "price": 2500.00,
        "quantity": 2
      }
    ]
    ```
- **Expected Response:** 201 Created
  ```json
  {
    "success": true,
    "message": "Sale recorded successfully",
    "sale_id": 1,
    "order_id": "ORD_20240324143500_1234",
    "transaction_id": "TXN_1234567890",
    "items_recorded": 1,
    "total": 5000.00,
    "timestamp": "2024-03-24T14:35:00+00:00"
  }
  ```

#### 9. **Update Inventory** (Test Update)
- **Endpoint:** POST `/update_inventory.php`
- **Input:**
  - inventory_id: `1`
  - new_stock: `200`
  - reason: `Addition`
- **Expected Response:** 200 OK
  ```json
  {
    "success": true,
    "message": "Inventory updated successfully",
    "inventory_id": 1,
    "old_stock": 150,
    "new_stock": 200,
    "change": 50,
    "reason": "Addition",
    "stock_status": "Normal",
    "unit": "boxes",
    "audit_logged": true,
    "timestamp": "2024-03-24T14:40:00+00:00"
  }
  ```

---

## 🔍 HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | ✅ Success (GET/UPDATE) | Data retrieved successfully |
| 201 | ✅ Created (POST) | New record created |
| 400 | ❌ Bad Request | Missing required fields |
| 401 | ❌ Unauthorized | Invalid login credentials |
| 404 | ❌ Not Found | Record doesn't exist |
| 405 | ❌ Method Not Allowed | Used POST on GET endpoint |
| 409 | ❌ Conflict | Duplicate record (e.g., email exists) |
| 500 | ❌ Server Error | Database connection failed |

---

## 🛠️ Troubleshooting

### 1. **CORS Error in Browser Console**
✅ **Already Fixed** - All APIs have CORS headers configured:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

### 2. **Database Connection Failed**
```
Error: "Database connection failed"
```
**Solution:**
- Verify MySQL/MariaDB is running
- Check credentials in `db.php`:
  - DB_HOST: `localhost`
  - DB_USER: `root`
  - DB_PASSWORD: `` (empty)
  - DB_NAME: `nestle_smartflow`
- Import `NestleFlow_DB.sql`

### 3. **"Invalid email or password" for Login**
**Solution:**
- Check that the user exists in the database
- Verify password is correct
- Passwords are hashed with BCRYPT - they're case-sensitive

### 4. **"Prepare failed: Syntax error"**
**Solution:**
- Check the SQL query in the PHP file
- Verify table and column names exist in database
- Check query parameter types match bind_param() declaration

### 5. **"Email already registered"**
**Solution:**
- Use a different email for registering new users
- Or check existing emails with `/get_users.php`

---

## 📊 API Summary

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/login.php` | POST | Authenticate user | User object (without password) |
| `/register.php` | POST | Create new user | User ID |
| `/get_users.php` | GET | Fetch all users | Array of users |
| `/get_products.php` | GET | Fetch all products | Array of products |
| `/get_inventory.php` | GET | Fetch inventory with stock | Array of inventory records |
| `/get_orders.php` | GET | Fetch orders with user info | Array of orders |
| `/add_shipment.php` | POST | Create shipment | Shipment ID + items count |
| `/record_sale.php` | POST | Record POS transaction | Order ID + transaction ID |
| `/update_inventory.php` | POST | Adjust stock levels | Updated inventory + old/new values |

---

## 🚀 Next Steps

1. ✅ Verify database is imported (`NestleFlow_DB.sql`)
2. ✅ Test all 9 APIs using the API Tester: http://localhost:8000/api_tester.html
3. ✅ Verify CORS is working (check browser console for errors)
4. ✅ Use APIs in Flutter Web application
5. ✅ Fix remaining Flutter compilation errors

---

## 📝 Database Schema Summary

**Tables:** users, products, inventory, orders, order_items, shipments, shipment_items, inventory_audit_log

**Key Tables:**
- `users` - User accounts with role-based access
- `products` - Product catalog with SKU and pricing
- `inventory` - Warehouse stock levels by zone
- `orders` - Customer orders with totals and status
- `order_items` - Line items for each order
- `shipments` - Incoming/outgoing shipments
- `inventory_audit_log` - Stock change history

---

Generated: 2024-03-24 | API Base URL: http://localhost:8000
