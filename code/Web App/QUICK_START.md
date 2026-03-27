# ⚡ Quick Start - Database & API

## 🎯 Your Setup Files Ready

| File | Location | Purpose |
|------|----------|---------|
| **nestle_smartflow_mysql.sql** | d:\Web App\ | MySQL Database schema (11 tables, 15+ records) |
| **db.php** | d:\Web App\nestle_api\ | PHP connection (pre-configured for MySQL) |
| **api_tester.html** | d:\Web App\nestle_api\ | Visual API testing interface |
| **DATABASE_IMPORT_GUIDE.md** | d:\Web App\ | Step-by-step import instructions |

---

## ⚙️ 3-Minute Setup

### **STEP 1: Import Database**

**Choose your method:**

**🖥️ Option A: MySQL Workbench (Easiest)**
```
1. Open MySQL Workbench
2. File → Open SQL Script
3. Select: nestle_smartflow_mysql.sql
4. Click Execute button ⚡
5. Done!
```

**💻 Option B: Command Prompt**
```
1. Open Command Prompt (cmd.exe)
2. Run:
   mysql -u root < "d:\APIIT\Thushain\CC 2\Web App\nestle_smartflow_mysql.sql"
```

**🌐 Option C: PhpMyAdmin**
```
1. Go to http://localhost/phpmyadmin
2. Click Import tab
3. Choose nestle_smartflow_mysql.sql
4. Click Go
```

### **STEP 2: Start PHP Server**

```bash
cd "d:\APIIT\Thushain\CC 2\Web App\nestle_api"
php -S localhost:8000
```

### **STEP 3: Open API Tester**

```
Go to: http://localhost:8000/api_tester.html
```

---

## 🧪 Quick Test

In the API Tester, click **Login** button:
- Email: `admin@gmail.com`
- Password: `password123` (or use plaintext for hashed passwords)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@gmail.com",
    "role": "admin"
  }
}
```

---

## 📊 Database Overview

**Database Name:** `nestle_smartflow`

**11 Tables:**
- ✅ users (5 default users)
- ✅ products (3 sample products)
- ✅ inventory (stock tracking)
- ✅ orders (sample orders)
- ✅ order_items (line items)
- ✅ shipments (delivery tracking)
- ✅ shipment_items (shipment contents)
- ✅ stock_allocations (reserved stock)
- ✅ inventory_audit_log (change history)
- ✅ warehouse_inventory (legacy storage)

---

## 👥 Default Login Credentials

```
User: admin
Email: admin@gmail.com
Password: password123

User: retailer (manager role)
Email: retailer@gmail.com
Password: password123

User: cashier
Email: cashier@gmail.com
Password: password123

User: warehouse
Email: warehouse@gmail.com
Password: password123
```

---

## 🔗 Your 10 APIs

| API | Type | URL |
|-----|------|-----|
| Login | POST | `/login.php` |
| Register | POST | `/register.php` |
| Get Users | GET | `/get_users.php` |
| Get Products | GET | `/get_products.php` |
| Get Inventory | GET | `/get_inventory.php` |
| Get Orders | GET | `/get_orders.php` |
| Add Shipment | POST | `/add_shipment.php` |
| Record Sale | POST | `/record_sale.php` |
| Update Inventory | POST | `/update_inventory.php` |
| Tester UI | Web | `/api_tester.html` |

---

## ✅ Verification Checklist

After importing, verify in MySQL:

```sql
USE nestle_smartflow;

-- Should show 11 tables
SHOW TABLES;

-- Should show 5 users
SELECT COUNT(*) FROM users;

-- Should show 3 products
SELECT COUNT(*) FROM products;

-- Should show database
SELECT DATABASE();
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| MySQL not found | Install MySQL/MariaDB from mysql.com |
| "Access Denied" | Check MySQL password in db.php |
| Port 8000 in use | Use: `php -S localhost:8001` |
| Database not found | Re-run import: `nestle_smartflow_mysql.sql` |
| API returns error | Check error.log in nestle_api folder |

---

## 📚 Full Documentation

- **DATABASE_IMPORT_GUIDE.md** - detailed import instructions
- **API_TESTING_GUIDE.md** - API details & testing guide
- **README_API_SETUP.md** - setup overview
- **API_DOCUMENTATION.md** - in nestlesmartflow/api folder

---

## 🎯 Next Actions

1. **Import database** using one of the 3 methods above
2. **Verify table creation** by running SHOW TABLES in MySQL
3. **Update db.php** if your MySQL has a password (line: const DB_PASSWORD)
4. **Start PHP server:** `php -S localhost:8000`
5. **Open tester:** http://localhost:8000/api_tester.html
6. **Test API:** Click buttons and verify responses

---

**Status:** 🟢 **READY FOR DATABASE IMPORT**
**All Files:** Created and prepared
**APIs:** Ready and waiting for database connection
**Support:** See documentation files for detailed guides

**Let me know when database is imported! 🚀**
