# 🗄️ Nestle SmartFlow Database Import Guide

## 📋 Current Status

✅ **Database Schema Created:** `nestle_smartflow_mysql.sql`
✅ **PHP APIs**: Ready (db.php configured for MySQL)
⏳ **Pending**: Import database into MySQL

---

## 🚀 How to Import Database

### **Option 1: Using MySQL Workbench (Recommended - GUI)**

1. **Open MySQL Workbench**
2. Click **File → Open SQL Script**
3. Select: `d:\APIIT\Thushain\CC 2\Web App\nestle_smartflow_mysql.sql`
4. Click **Execute** (lightning bolt icon) or press `Ctrl+Shift+Enter`
5. Wait for completion - you should see "Success" messages
6. Verify: Click **Schemas** tab, refresh, and look for `nestle_smartflow` database

### **Option 2: Using Command Line (CMD)**

1. **Open Command Prompt (cmd.exe)** - NOT PowerShell
2. Navigate to your MySQL bin folder:
```bash
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
```
(Or `C:\Program Files\MariaDB 10.x\bin` if using MariaDB)

3. Run the import command:
```bash
mysql -u root -pYOUR_PASSWORD < "d:\APIIT\Thushain\CC 2\Web App\nestle_smartflow_mysql.sql"
```

Replace `YOUR_PASSWORD` with your MySQL root password (if empty, omit `-p`)

**Example with no password:**
```bash
mysql -u root < "d:\APIIT\Thushain\CC 2\Web App\nestle_smartflow_mysql.sql"
```

4. Output should be clean with no errors

### **Option 3: Using MySQL Command Line Client**

1. **Open MySQL Command Line Client** (from Start Menu)
2. Enter root password when prompted
3. You'll see `mysql>` prompt
4. Run this command:
```sql
SOURCE d:\APIIT\Thushain\CC 2\Web App\nestle_smartflow_mysql.sql;
```
(Note: Use forward slashes or double backslashes)

Or alternatively:
```sql
\. d:/APIIT/Thushain/CC 2/Web App/nestle_smartflow_mysql.sql
```

5. Wait for all commands to execute
6. You'll see output from the test queries at the end

### **Option 4: PhpMyAdmin (Web-based)**

1. Open **PhpMyAdmin** in browser (usually `http://localhost/phpmyadmin`)
2. Click **Import** tab
3. Choose file: `nestle_smartflow_mysql.sql`
4. Click **Go/Import**
5. Wait for completion

---

## ✅ Verify Database Import

After importing, verify everything is set up correctly:

### **In MySQL Command Line:**
```sql
-- Use the database
USE nestle_smartflow;

-- Check all tables were created
SHOW TABLES;

-- Count users (should be 5)
SELECT COUNT(*) FROM users;

-- Count products (should be 3)
SELECT COUNT(*) FROM products;

-- Check user data
SELECT * FROM users;

-- Check product data
SELECT * FROM products;

-- Check inventory
SELECT * FROM inventory;
```

### **Expected Results:**

```
Database name: nestle_smartflow
Total tables: 11
- users (5 users)
- products (3 products)
- inventory (3 inventory records)
- warehouse_inventory (3 records)
- shipments (2 sample shipments)
- shipment_items
- orders (2 sample orders)
- order_items (2 items)
- stock_allocations (2 allocations)
- inventory_audit_log (tracking)
```

---

## 📊 Default Users Created

After import, these users are available for testing:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@gmail.com | 123456 | admin |
| retailer | retailer@gmail.com | 123456 | manager |
| distributor | distributor@gmail.com | 123456 | distributor |
| cashier | cashier@gmail.com | 123456 | cashier |
| warehouse | warehouse@gmail.com | 123456 | warehouse_staff |

**Note:** Passwords in the database are hashed with BCRYPT. Use the plaintext password `password123` for login through the API tester.

---

## 🔧 Database Connection from PHP

Your `db.php` is already configured to connect:

```php
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASSWORD = '';
const DB_NAME = 'nestle_smartflow';
```

### **If your MySQL has a password:**
Edit `d:\APIIT\Thushain\CC 2\Web App\nestle_api\db.php`:

Find line:
```php
const DB_PASSWORD = '';
```

Change to:
```php
const DB_PASSWORD = 'your_mysql_password';
```

---

## 📋 Database Schema Summary

### **Tables Created: 11**

| Table | Purpose | Records |
|-------|---------|---------|
| **users** | User accounts & roles | 5 |
| **products** | Product catalog | 3 |
| **inventory** | Warehouse stock levels | 3 |
| **warehouse_inventory** | Legacy inventory format | 3 |
| **shipments** | Incoming/Outgoing shipments | 2 |
| **shipment_items** | Items in shipments | - |
| **orders** | Customer orders | 2 |
| **order_items** | Line items per order | 2 |
| **stock_allocations** | Stock reserved for orders | 2 |
| **inventory_audit_log** | Stock change history | - |

### **Key Features:**

✅ **Auto-increment IDs** - Primary keys auto-generate  
✅ **Foreign Keys** - Relational integrity enforced  
✅ **CHECK Constraints** - Role validation, status validation  
✅ **Unique Constraints** - Email & username uniqueness  
✅ **ON DELETE CASCADE** - Clean data deletion  
✅ **Timestamps** - Created_at and updated_at tracking  

---

## 🚀 Next Steps After Import

1. ✅ **Verify Tables** - Run SHOW TABLES in MySQL
2. ✅ **Test PHP Connection** - Start PHP server: `php -S localhost:8000`
3. ✅ **Open API Tester** - http://localhost:8000/api_tester.html
4. ✅ **Test Login API** - Use credentials from table above
5. ✅ **Test All APIs** - Test each endpoint with the tester interface

---

## 🆘 Troubleshooting

### **"Access Denied" when importing**
- Check MySQL root password
- Ensure no spaces in command
- Try single quotes: `mysql -u root -p''`

### **"File not found"**
- Verify file path is correct
- Use forward slashes: `d:/APIIT/Thushain/CC 2/Web App/...`
- Or escape backslashes: `d:\\APIIT\\...`

### **"Table already exists" errors**
- Normal if running import again
- Script includes `DROP TABLE IF EXISTS` to handle this
- Safe to run multiple times

### **"Unknown database 'nestle_smartflow'"**
- Database not created correctly
- Ensure line `CREATE DATABASE IF NOT EXISTS...` executed
- Check for errors at start of import

### **"Foreign key constraint fails"**
- Ensure tables are created in correct order (tables already are)
- Check that referenced products/users exist

### **PHP says "Can't connect to MySQL"**
- Verify MySQL is running
- Check credentials in `db.php`
- Verify database name: `nestle_smartflow`

---

## ✅ Import Instructions Summary

**Easiest Method for Windows:**
1. Use **MySQL Workbench** (GUI)
2. File → Open SQL Script → Select file
3. Execute button (Execute button)
4. Done!

**Command Line Method:**
1. Open **Command Prompt** (cmd.exe)
2. Run: `mysql -u root < "d:\APIIT\Thushain\CC 2\Web App\nestle_smartflow_mysql.sql"`
3. Done!

---

**Database File:** `nestle_smartflow_mysql.sql`  
**Size:** ~15 KB  
**Tables:** 11  
**Default Records:** 15+  
**Status:** Ready for import ✅

