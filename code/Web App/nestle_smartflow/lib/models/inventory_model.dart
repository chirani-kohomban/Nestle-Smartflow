class Inventory {
  final int id;
  final int productId;
  final String productName;
  final String sku;
  final int currentStock;
  final int minStock;
  final int maxStock;
  final String zone;
  final DateTime? lastUpdated;

  Inventory({
    required this.id,
    required this.productId,
    required this.productName,
    required this.sku,
    required this.currentStock,
    required this.minStock,
    required this.maxStock,
    required this.zone,
    this.lastUpdated,
  });

  factory Inventory.fromJson(Map<String, dynamic> json) {
    return Inventory(
      id: json['id'] ?? 0,
      productId: json['product_id'] ?? 0,
      productName: json['product_name'] ?? json['name'] ?? '',
      sku: json['sku'] ?? '',
      currentStock: int.tryParse(json['current_stock'].toString()) ?? 0,
      minStock: int.tryParse(json['min_stock'].toString()) ?? 0,
      maxStock: int.tryParse(json['max_stock'].toString()) ?? 0,
      zone: json['zone'] ?? '',
      lastUpdated: json['last_updated'] != null
          ? DateTime.parse(json['last_updated'] as String)
          : null,
    );
  }

  bool get isLowStock => currentStock <= minStock;

  Map<String, dynamic> toJson() => {
        'id': id,
        'product_id': productId,
        'product_name': productName,
        'sku': sku,
        'current_stock': currentStock,
        'min_stock': minStock,
        'max_stock': maxStock,
        'zone': zone,
        'last_updated': lastUpdated?.toIso8601String(),
      };
}
