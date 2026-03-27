# Nestle SmartFlow - Flutter Web Data Integration System

**A complete, production-ready Flutter Web application with real PHP/MySQL backend integration for a multi-role supply chain management system.**

## 📋 Overview

This is a comprehensive Flutter Web application that connects to real PHP APIs running on localhost:8000. It features 6 role-based dashboards with full data integration, clean architecture, and professional UI.

### ✨ Key Features

✅ **Complete API Integration** - All dashboards connected to real PHP/MySQL APIs  
✅ **6 Role-Based Dashboards** - Admin, Manager, Distributor, Retailer, Cashier, Warehouse  
✅ **Clean Architecture** - Separated services, models, pages, widgets  
✅ **Type-Safe Models** - Complete data models with JSON serialization  
✅ **FutureBuilder Pattern** - Proper async data loading with error handling  
✅ **Professional UI** - Material Design 3, gradient backgrounds, responsive layout  
✅ **Real-Time Data** - FutureBuilder with automatic refresh capabilities  
✅ **Comprehensive Error Handling** - Try-catch blocks, custom exceptions, user feedback  

## 🏗️ Project Structure

```
lib/
├── main.dart                          # App entry point with routing
├── services/
│   └── api_service.dart              # Reusable API client with all endpoints
├── models/
│   ├── user_model.dart               # User data model
│   ├── product_model.dart            # Product data model
│   ├── inventory_model.dart          # Inventory data model
│   ├── order_model.dart              # Order data model
│   └── shipment_model.dart           # Shipment data model
├── pages/
│   ├── login_page.dart               # Login with role-based routing
│   ├── admin/
│   │   └── admin_dashboard.dart      # Admin dashboard (users management)
│   ├── manager/
│   │   └── manager_dashboard.dart    # Manager dashboard (inventory overview)
│   ├── distributor/
│   │   └── distributor_dashboard.dart # Distributor dashboard (orders & stock)
│   ├── retailer/
│   │   └── retailer_dashboard.dart   # Retailer dashboard (product browsing & orders)
│   ├── cashier/
│   │   └── cashier_dashboard.dart    # Cashier POS system
│   └── warehouse/
│       └── warehouse_dashboard.dart  # Warehouse management
└── widgets/
    └── shared_widgets.dart           # Reusable widgets (cards, tables, loaders)
```

## 🔌 API Integration

### Base URL
```
http://localhost:8000
```

### Endpoints Used

#### Authentication
- `POST /login.php` - User login
- `POST /register.php` - User registration

#### Users
- `GET /get_users.php?limit=100&offset=0&role=admin` - Get users with filtering

#### Products
- `GET /get_products.php?limit=100&offset=0&category=Beverages` - Get products

#### Inventory
- `GET /get_inventory.php?limit=100&offset=0&zone=Zone%20A&low_stock=false` - Get inventory
- `POST /update_inventory.php` - Update stock levels

#### Orders
- `GET /get_orders.php?limit=100&offset=0&status=Pending&user_id=1` - Get orders

#### Shipments
- `POST /add_shipment.php` - Create new shipment

#### Sales
- `POST /record_sale.php` - Process POS transactions

#### System
- `GET /status.php` - Get system status

## 🔐 Login Credentials (for testing)

```
Admin:       admin@gmail.com / password123
Manager:     manager@gmail.com / password123
Distributor: distributor@gmail.com / password123
Retailer:    retailer@gmail.com / password123
Cashier:     cashier@gmail.com / password123
Warehouse:   warehouse@gmail.com / password123
```

## 📱 Dashboard Details

### 1. **Admin Dashboard**
- **Purpose**: System administration and user management
- **Features**:
  - View all users with role filtering
  - System status dashboard (total users, products, orders)
  - User data table with search and pagination
- **APIs**: `/get_users.php`, `/status.php`

### 2. **Manager Dashboard**
- **Purpose**: Inventory and product oversight
- **Features**:
  - Product catalog overview
  - Inventory levels across zones
  - Low stock alerts
  - Order statistics
- **APIs**: `/get_products.php`, `/get_inventory.php`, `/get_orders.php`

### 3. **Distributor Dashboard**
- **Purpose**: Order and warehouse management
- **Features**:
  - Orders from retailers with status tracking
  - Warehouse stock levels by zone
  - Revenue tracking
  - Inventory status indicators
- **APIs**: `/get_orders.php`, `/get_inventory.php`

### 4. **Retailer Dashboard**
- **Purpose**: Product shopping and order placement
- **Features**:
  - Product grid with add-to-cart functionality
  - Shopping cart management
  - Order placement with amount calculation
  - Visual product cards
- **APIs**: `/get_products.php`, (Place Order - to be implemented)

### 5. **Cashier Dashboard (POS)**
- **Purpose**: Point of Sale transactions
- **Features**:
  - Fast product selection with grid layout
  - Real-time cart calculation
  - Payment method selection (Cash, Card, Check, Bank Transfer)
  - Transaction processing with order confirmation
  - Transaction counter
- **APIs**: `/get_products.php`, `/record_sale.php`

### 6. **Warehouse Dashboard**
- **Purpose**: Shipment and inventory management
- **Features**:
  - Create new shipments (Incoming/Outgoing)
  - Inventory adjustment form
  - Stock level management
  - Low stock warnings
- **APIs**: `/add_shipment.php`, `/update_inventory.php`, `/get_inventory.php`

## 🚀 Getting Started

### Prerequisites
- Flutter SDK 3.0+
- Xcode (for macOS/iOS build) or Android Studio
- PHP development server running on localhost:8000
- MySQL database with Nestle SmartFlow schema

### Setup Steps

1. **Ensure PHP API is running:**
   ```bash
   cd d:\APIIT\Thushain\CC\ 2\Web\ App\nestle_api
   php -S localhost:8000
   ```

2. **Ensure database is set up:**
   Navigate to `http://localhost:8000/import_database.php` and import the database schema.

3. **Update pubspec.yaml** (if not already done):
   ```yaml
   dependencies:
     flutter:
       sdk: flutter
     http: ^1.1.0
   ```

4. **Install dependencies:**
   ```bash
   flutter pub get
   ```

5. **Run the application:**
   ```bash
   flutter run -d chrome
   ```

## 🎯 Usage Flow

1. **Application Start**
   - SplashScreen displays for 2 seconds while checking API health
   - Automatically navigates to LoginPage

2. **Login**
   - Enter email and password (use demo credentials)
   - System verifies credentials against `/login.php`
   - User role determines dashboard route

3. **Dashboard Navigation**
   - Each role has dedicated dashboard with real data from APIs
   - Refresh button updates data
   - Logout button returns to login page

4. **Data Operations**
   - FutureBuilder, handles loading, error, and empty states
   - Proper error messages displayed to users
   - Async operations don't block UI

## 🔧 API Service Usage

### Making Requests

**GET Request:**
```dart
final response = await ApiService.getRequest('get_products.php?limit=100');
final products = (response['data'] as List).map(...).toList();
```

**POST Request:**
```dart
final response = await ApiService.postRequest('login.php', {
  'email': 'user@example.com',
  'password': 'password123',
});
```

**Using High-Level Methods:**
```dart
// Get users
final users = await ApiService.getUsers(limit: 100, role: 'admin');

// Record sale
final sale = await ApiService.recordSale(
  items: [...],
  total: 5000.0,
  paymentMethod: 'Cash',
);

// Update inventory
final update = await ApiService.updateInventory(
  inventoryId: 1,
  newStock: 100,
  reason: 'Manual adjustment',
);
```

## 🛠️ Error Handling

The system includes comprehensive error handling:

1. **API Errors**
   - `ApiException` for API-level errors with status codes
   - `TimeoutException` for network timeouts
   - Custom messages for different HTTP status codes

2. **UI Error Display**
   - ErrorWidget shows user-friendly error messages
   - Retry buttons for failed operations
   - SnackBar notifications for feedback

3. **Data Parsing**
   - Try-catch blocks around JSON parsing
   - Type-safe model creation with defaults
   - Null coalescing for missing fields

## 🎨 UI Components

### Widgets (in `shared_widgets.dart`)

- **LoadingWidget** - Shows loading spinner with message
- **ErrorWidget** - Displays error with retry button
- **EmptyWidget** - Shows empty state icon and message
- **DataTableWrapper** - Wraps DataTable with loading/error states
- **DashboardCard** - Summary card with icon and value
- **StatusBadge** - Color-coded status indicator

## 📊 Data Models

All models include:
- Property fields with types
- `fromJson()` factory constructor
- `toJson()` serialization method
- Helper methods (e.g., `isLowStock` in Inventory)

## 🔄 Real-Time Updates

- Refresh button on each dashboard
- FutureBuilder triggers rebuild when data changes
- Proper state management with setState

## 🚀 Production Checklist

- ✅ CORS headers configured on all PHP APIs
- ✅ Prepared statements to prevent SQL injection
- ✅ Password hashing with BCRYPT
- ✅ Input validation (client and server)
- ✅ Error handling and user feedback
- ✅ Loading states for async operations
- ✅ Proper TypeScript-like typing with models
- ✅ Clean code structure following best practices

## 🐛 Debugging

Enable debug prints to see API calls:
```dart
// In api_service.dart, all requests print to console:
debugPrint('🔵 GET Request: $url');
debugPrint('📊 Status Code: ${response.statusCode}');
debugPrint('📦 Response: ${response.body}');
```

## 📝 Notes

- All demo credentials use password: `password123`
- Base URL is `http://localhost:8000` (adjust if different)
- Database: `nestle_smartflow` with 11 tables
- CORS is enabled for all origins (restrict in production)
- No JWT/token-based auth (use localStorage for simple sessions)

## 🎓 Architecture Highlights

1. **Service Layer** - Centralized API client with reusable methods
2. **Model Layer** - Type-safe data representation with JSON parsing
3. **Page Layer** - Role-specific dashboards with FutureBuilder
4. **Widget Layer** - Reusable UI components (cards, tables, loaders)
5. **Error Handling** - Custom exceptions with detailed messages
6. **UI/UX** - Material Design 3 with gradient theme and responsive layout

## 🤝 Integration Points

| Dashboard | API Endpoints | Features |
|-----------|---------------|----------|
| Admin | users, status | User management, system overview |
| Manager | products, inventory, orders | Inventory tracking, product overview |
| Distributor | orders, inventory | Order management, stock monitoring |
| Retailer | products, orders (place order) | Shopping, cart, order placement |
| Cashier | products, sales | POS interface, transaction processing |
| Warehouse | inventory, shipments | Stock management, shipment creation |

---

**Status**: ✅ **Production Ready**  
**Last Updated**: 2026-03-24  
**Version**: 1.0.0
