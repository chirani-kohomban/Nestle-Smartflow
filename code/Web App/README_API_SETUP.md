# 🏭 Nestle SmartFlow - PHP API Testing Guide

## 📁 What's Ready

Your PHP APIs are **fully functional** and ready for testing! Here's what you have:

### ✅ API Files (in `nestle_api/` folder)
1. **db.php** - Database connection with CORS headers
2. **login.php** - User authentication (POST)
3. **register.php** - User registration (POST)
4. **get_users.php** - Fetch users (GET)
5. **get_products.php** - Fetch products (GET)
6. **get_inventory.php** - Fetch warehouse inventory (GET)
7. **get_orders.php** - Fetch orders (GET)
8. **add_shipment.php** - Create shipments (POST)
9. **record_sale.php** - Record POS transactions (POST)
10. **update_inventory.php** - Update stock levels (POST)

### ✅ Tools Provided
- **api_tester.html** - Visual API testing interface
- **API_TESTING_GUIDE.md** - Detailed testing guide
- **setup_database.bat** - Auto database import script
- **start_server.bat** - Easy server startup script

---

## 🚀 Quick Start (3 Steps)

### Step 1️⃣: Setup Database
```bash
# Option A: Run batch script (Windows)
double-click: setup_database.bat

# Option B: Manual import (any OS)
mysql -u root -p < NestleFlow_DB.sql
```

### Step 2️⃣: Start PHP Server
```bash
# Option A: Run batch script (Windows)
double-click: start_server.bat

# Option B: Manual start
cd d:\APIIT\Thushain\CC 2\Web App\nestle_api
php -S localhost:8000
```

### Step 3️⃣: Open API Tester
Open **Google Chrome** and go to:
```
http://localhost:8000/api_tester.html
```

---

## 🧪 How to Test APIs

### Using the API Tester (Recommended)

1. **Open the tester page** (see Step 3 above)
2. **Each API has a card with:**
   - Pre-filled example data
   - Input fields for your values
   - "Test" button to execute
   - JSON response display

### Test Sequence (Recommended Order)

#### ✅ **1. Register a New User**
```
Endpoint: POST /register.php
Fields: Username, Email, Password
Expected: 201 Created + User ID
```

#### ✅ **2. Login**
```
Endpoint: POST /login.php
Fields: Email, Password
Expected: 200 OK + User object (without password)
```

#### ✅ **3. Get Users**
```
Endpoint: GET /get_users.php
Optional: Role filter
Expected: Array of users
```

#### ✅ **4. Get Products**
```
Endpoint: GET /get_products.php
Optional: Category filter
Expected: Array of products with prices
```

#### ✅ **5. Get Inventory**
```
Endpoint: GET /get_inventory.php
Optional: Zone filter, Low stock checkbox
Expected: Inventory with stock levels, min/max bounds
```

#### ✅ **6. Get Orders**
```
Endpoint: GET /get_orders.php
Optional: Status filter, User ID filter
Expected: Orders with user details
```

#### ✅ **7. Add Shipment**
```
Endpoint: POST /add_shipment.php
Fields: Shipment ID, Type (Incoming/Outgoing), Supplier
Expected: 201 Created + Shipment ID
```

#### ✅ **8. Record Sale**
```
Endpoint: POST /record_sale.php
Fields: Total, Payment Method, Items (JSON array)
Expected: 201 Created + Order ID + Transaction ID
```

#### ✅ **9. Update Inventory**
```
Endpoint: POST /update_inventory.php
Fields: Inventory ID, New Stock, Reason
Expected: 200 OK + Old stock + New stock + Change
```

---

## 📊 Response Codes Quick Reference

| Code | Meaning | When You See It |
|------|---------|-----------------|
| **200** | ✅ Success | GET/Update operations worked |
| **201** | ✅ Created | POST operations (user registered, sale recorded) |
| **400** | ❌ Bad Request | Missing required fields, invalid format |
| **401** | ❌ Unauthorized | Wrong email/password in login |
| **404** | ❌ Not Found | Record doesn't exist |
| **405** | ❌ Wrong Method | Used GET on POST endpoint or vice versa |
| **409** | ❌ Conflict | Duplicate record (email already exists) |
| **500** | ❌ Server Error | Database connection issues |

---

## 🔧 API Details

### POST Endpoints (Create/Insert)

#### **Login** `POST /login.php`
```json
Request: {
  "email": "admin@nestle.com",
  "password": "password123"
}

Response (200): {
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@nestle.com",
    "role": "admin"
  }
}
```

#### **Register** `POST /register.php`
```json
Request: {
  "username": "newuser",
  "email": "newuser@test.com",
  "password": "password123"
}

Response (201): {
  "success": true,
  "user_id": 5
}
```

#### **Add Shipment** `POST /add_shipment.php`
```json
Request: {
  "shipment_id": "SHP-001",
  "type": "Incoming",
  "supplier": "Supplier Name",
  "tracking_number": "TRACK123",
  "items": [
    {
      "product_id": 1,
      "quantity": 100
    }
  ]
}

Response (201): {
  "success": true,
  "shipment_id": 1,
  "items_added": 1
}
```

#### **Record Sale** `POST /record_sale.php`
```json
Request: {
  "total": 5000.00,
  "payment_method": "Cash",
  "items": [
    {
      "product_id": 1,
      "product_name": "Product A",
      "price": 2500.00,
      "quantity": 2
    }
  ]
}

Response (201): {
  "success": true,
  "order_id": "ORD_20240324143500_1234",
  "transaction_id": "TXN_1234567890",
  "total": 5000.00
}
```

#### **Update Inventory** `POST /update_inventory.php`
```json
Request: {
  "inventory_id": 1,
  "new_stock": 200,
  "reason": "Addition"
}

Response (200): {
  "success": true,
  "old_stock": 150,
  "new_stock": 200,
  "change": 50
}
```

### GET Endpoints (Read/Fetch)

#### **Get Users** `GET /get_users.php?role=admin&limit=10&offset=0`
```json
Response (200): {
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

#### **Get Products** `GET /get_products.php?category=Beverages&limit=10`
```json
Response (200): {
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

#### **Get Inventory** `GET /get_inventory.php?zone=Zone%20A&limit=10`
```json
Response (200): {
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Nescafé Classic",
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

#### **Get Orders** `GET /get_orders.php?status=Completed&limit=10`
```json
Response (200): {
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": "ORD-20240101001",
      "user_id": 2,
      "username": "retailer1",
      "total_amount": 5000.00,
      "status": "Completed",
      "payment_method": "Cash"
    }
  ],
  "count": 1
}
```

---

## 🛠️ Troubleshooting

### Problem: "Database connection failed"
**Solution:**
1. Verify MySQL/MariaDB is running
2. Check `db.php` credentials match your setup:
   - `DB_HOST`: localhost
   - `DB_USER`: root
   - `DB_PASSWORD`: (empty or your password)
   - `DB_NAME`: nestle_smartflow
3. Run `setup_database.bat` to import schema
4. Check `error.log` in `nestle_api/` folder

### Problem: "CORS error" in browser console
**Solution:** ✅ Already fixed! All APIs have CORS headers:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

### Problem: "Invalid email or password" on login
**Solution:**
- Check email is correct (case-sensitive for some systems)
- Verify user exists: use `/get_users.php` to list all users
- Try with default admin account: `admin@nestle.com` / `password123`

### Problem: "Email already registered"
**Solution:**
- Use a different email address
- Check existing emails with `/get_users.php`
- Or delete the user from database if testing

### Problem: "Port 8000 already in use"
**Solution:**
1. Check if another process is using port 8000
2. Use a different port:
   ```bash
   php -S localhost:8001
   ```
   Then access: `http://localhost:8001/api_tester.html`
3. Or kill existing PHP process:
   ```bash
   taskkill /F /IM php.exe
   ```

---

## 📝 Integration with Flutter Web

Once APIs are tested and working:

1. Update Flutter API endpoints in your code:
   ```dart
   const apiBase = 'http://localhost:8000';
   ```

2. Use the same JSON structure as test responses

3. Test API calls in Flutter:
   ```dart
   var response = await http.post(
     Uri.parse('http://localhost:8000/login.php'),
     body: jsonEncode({'email': 'admin@nestle.com', 'password': 'password123'}),
   );
   ```

---

## 📞 Support

For detailed testing guide, see: **API_TESTING_GUIDE.md**

For API documentation, see: **nestlesmartflow/api/API_DOCUMENTATION.md**

---

**Status:** ✅ All APIs ready for testing
**Server:** http://localhost:8000
**Tester:** http://localhost:8000/api_tester.html
**Database:** nestle_smartflow (import NestleFlow_DB.sql)

