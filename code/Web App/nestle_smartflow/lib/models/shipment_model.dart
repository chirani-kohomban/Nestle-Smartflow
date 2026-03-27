class Shipment {
  final int id;
  final String shipmentId;
  final String type;
  final String supplier;
  final String? trackingNumber;
  final String? expectedDate;
  final String? notes;
  final DateTime? createdAt;

  Shipment({
    required this.id,
    required this.shipmentId,
    required this.type,
    required this.supplier,
    this.trackingNumber,
    this.expectedDate,
    this.notes,
    this.createdAt,
  });

  factory Shipment.fromJson(Map<String, dynamic> json) {
    return Shipment(
      id: json['id'] ?? 0,
      shipmentId: json['shipment_id'] ?? '',
      type: json['type'] ?? 'Incoming',
      supplier: json['supplier'] ?? '',
      trackingNumber: json['tracking_number'],
      expectedDate: json['expected_date'],
      notes: json['notes'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'shipment_id': shipmentId,
        'type': type,
        'supplier': supplier,
        'tracking_number': trackingNumber,
        'expected_date': expectedDate,
        'notes': notes,
        'created_at': createdAt?.toIso8601String(),
      };
}
