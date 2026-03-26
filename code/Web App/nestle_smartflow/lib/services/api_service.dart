import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  // Base URL - Points to XAMPP localhost PHP API directory
  static const String baseUrl = 'http://localhost/nestle_api';

  // Private constructor
  ApiService._();

  // Static method for GET requests
  static Future<Map<String, dynamic>> getRequest(String endpoint) async {
    try {
      final url = Uri.parse('$baseUrl/$endpoint');
      debugPrint('🔵 GET Request: $url');

      final response = await http.get(url).timeout(
            const Duration(seconds: 10),
            onTimeout: () =>
                throw TimeoutException('Request timeout after 10 seconds'),
          );

      debugPrint('📊 Status Code: ${response.statusCode}');
      debugPrint('📦 Response: ${response.body}');

      if (response.statusCode == 200) {
        return _parseJsonResponse(response.body);
      } else {
        throw ApiException(
          statusCode: response.statusCode,
          message: _extractErrorMessage(response.body) ??
              'Server error: ${response.statusCode}',
          response: response.body,
        );
      }
    } on TimeoutException catch (e) {
      debugPrint('⏱️ Timeout: ${e.message}');
      rethrow;
    } catch (e) {
      debugPrint('❌ Error: $e');
      rethrow;
    }
  }

  // Static method for POST requests
  static Future<Map<String, dynamic>> postRequest(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    try {
      final url = Uri.parse('$baseUrl/$endpoint');
      debugPrint('🟠 POST Request: $url');
      debugPrint('📤 Body: $body');

      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode(body),
          )
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () =>
                throw TimeoutException('Request timeout after 10 seconds'),
          );

      debugPrint('📊 Status Code: ${response.statusCode}');
      debugPrint('📦 Response: ${response.body}');

      // PHP returns 200, 201, 400, 401, 409, 500
      if (response.statusCode == 200 || response.statusCode == 201) {
        return _parseJsonResponse(response.body);
      } else {
        throw ApiException(
          statusCode: response.statusCode,
          message: _extractErrorMessage(response.body) ??
              'Server error: ${response.statusCode}',
          response: response.body,
        );
      }
    } on TimeoutException catch (e) {
      debugPrint('⏱️ Timeout: ${e.message}');
      rethrow;
    } catch (e) {
      debugPrint('❌ Error: $e');
      rethrow;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  /// Login user with email and password
  /// Returns: {status: 'success', id, username, email, role}
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await postRequest(
      'login.php',
      {'email': email, 'password': password},
    );

    if (response['user'] is Map<String, dynamic>) {
      final user = response['user'] as Map<String, dynamic>;
      return {
        ...response,
        ...user,
      };
    }

    return response;
  }

  /// Register new user
  /// Returns: {status: 'success', user_id}
  static Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    return postRequest(
      'register.php',
      {
        'username': username,
        'email': email,
        'password': password,
        'full_name': fullName,
        'role': role,
      },
    );
  }

  // ==================== USER ENDPOINTS ====================

  /// Get all users with optional filtering
  /// Parameters: limit, offset, role
  static Future<Map<String, dynamic>> getUsers({
    int limit = 100,
    int offset = 0,
    String? role,
  }) async {
    String endpoint = 'get_users.php?limit=$limit&offset=$offset';
    if (role != null) {
      endpoint += '&role=$role';
    }
    return getRequest(endpoint);
  }

  // ==================== PRODUCT ENDPOINTS ====================

  /// Get all products with optional filtering
  /// Parameters: limit, offset, category
  static Future<Map<String, dynamic>> getProducts({
    int limit = 100,
    int offset = 0,
    String? category,
  }) async {
    String endpoint = 'get_products.php?limit=$limit&offset=$offset';
    if (category != null) {
      endpoint += '&category=$category';
    }
    return getRequest(endpoint);
  }

  // ==================== INVENTORY ENDPOINTS ====================

  /// Get inventory with optional filtering
  /// Parameters: limit, offset, zone, low_stock
  static Future<Map<String, dynamic>> getInventory({
    int limit = 100,
    int offset = 0,
    String? zone,
    bool lowStockOnly = false,
  }) async {
    String endpoint = 'get_inventory.php?limit=$limit&offset=$offset';
    if (zone != null) {
      endpoint += '&zone=$zone';
    }
    if (lowStockOnly) {
      endpoint += '&low_stock=true';
    }
    return getRequest(endpoint);
  }

  /// Update inventory stock levels
  /// Returns: {status: 'success', old_stock, new_stock, change}
  static Future<Map<String, dynamic>> updateInventory({
    required int inventoryId,
    required int newStock,
    required String reason,
  }) async {
    return postRequest(
      'update_inventory.php',
      {
        'inventory_id': inventoryId,
        'new_stock': newStock,
        'reason': reason,
      },
    );
  }

  // ==================== ORDER ENDPOINTS ====================

  /// Get all orders with optional filtering
  /// Parameters: limit, offset, status, user_id
  static Future<Map<String, dynamic>> getOrders({
    int limit = 100,
    int offset = 0,
    String? status,
    int? userId,
  }) async {
    String endpoint = 'get_orders.php?limit=$limit&offset=$offset';
    if (status != null) {
      endpoint += '&status=$status';
    }
    if (userId != null) {
      endpoint += '&user_id=$userId';
    }
    return getRequest(endpoint);
  }

  // ==================== SHIPMENT ENDPOINTS ====================

  /// Add new shipment
  /// Returns: {status: 'success', shipment_id, shipment_number}
  static Future<Map<String, dynamic>> addShipment({
    required String shipmentId,
    required String type,
    required String supplier,
    String? trackingNumber,
    String? expectedDate,
    String? notes,
    List<Map<String, dynamic>>? items,
  }) async {
    return postRequest(
      'add_shipment.php',
      {
        'shipment_id': shipmentId,
        'type': type,
        'supplier': supplier,
        'tracking_number': trackingNumber,
        'expected_date': expectedDate,
        'notes': notes,
        'items': items ?? [],
      },
    );
  }

  // ==================== POINT OF SALE ENDPOINTS ====================

  /// Record a sale transaction
  /// Returns: {status: 'success', order_id, transaction_id}
  static Future<Map<String, dynamic>> recordSale({
    required List<Map<String, dynamic>> items,
    required double total,
    required String paymentMethod,
    int? userId,
    String? transactionId,
  }) async {
    return postRequest(
      'record_sale.php',
      {
        'items': items,
        'total': total,
        'payment_method': paymentMethod,
        'user_id': userId,
        'transaction_id': transactionId,
      },
    );
  }

  // ==================== UTILITY METHODS ====================

  /// Check API health/status
  static Future<bool> checkApiHealth() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/status.php'))
          .timeout(const Duration(seconds: 5));
      if (response.statusCode != 200) {
        return false;
      }

      final data = _parseJsonResponse(response.body);
      return data['success'] == true;
    } catch (e) {
      debugPrint('❌ API Health Check Failed: $e');
      return false;
    }
  }

  /// Get API status and database info
  static Future<Map<String, dynamic>> getApiStatus() async {
    return getRequest('status.php');
  }

  static Map<String, dynamic> _parseJsonResponse(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }

      throw const FormatException('Response is not a JSON object');
    } catch (e) {
      throw ApiException(
        message: 'Invalid JSON response from API',
        response: body,
      );
    }
  }

  static String? _extractErrorMessage(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded['message']?.toString();
      }
    } catch (_) {
      if (body.trim().isNotEmpty) {
        return 'Unexpected server response: ${body.trim().split('\n').first}';
      }
    }

    return null;
  }
}

// Custom exception for API errors
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final String? response;

  ApiException({
    this.statusCode,
    required this.message,
    this.response,
  });

  @override
  String toString() {
    if (statusCode != null) {
      return 'ApiException: [$statusCode] $message';
    }
    return 'ApiException: $message';
  }
}

// Timeout exception
class TimeoutException implements Exception {
  final String message;

  TimeoutException(this.message);

  @override
  String toString() => 'TimeoutException: $message';
}
