class Order {
  final int orderId;
  final int userId;
  final String username;
  final String email;
  final double totalAmount;
  final String status;
  final String? paymentMethod;
  final DateTime? createdAt;

  Order({
    required this.orderId,
    required this.userId,
    required this.username,
    required this.email,
    required this.totalAmount,
    required this.status,
    this.paymentMethod,
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['order_id'] ?? 0,
      userId: json['user_id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      totalAmount: double.tryParse(json['total_amount'].toString()) ?? 0.0,
      status: json['status'] ?? 'Pending',
      paymentMethod: json['payment_method'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'order_id': orderId,
        'user_id': userId,
        'username': username,
        'email': email,
        'total_amount': totalAmount,
        'status': status,
        'payment_method': paymentMethod,
        'created_at': createdAt?.toIso8601String(),
      };
}
