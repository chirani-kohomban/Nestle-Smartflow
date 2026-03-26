class Product {
  final int id;
  final String name;
  final String sku;
  final double price;
  final String? category;
  final String? description;

  Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.price,
    this.category,
    this.description,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      sku: json['sku'] ?? '',
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      category: json['category'],
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'sku': sku,
        'price': price,
        'category': category,
        'description': description,
      };
}
