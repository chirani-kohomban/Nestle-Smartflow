import 'package:flutter/material.dart';
import '../../models/inventory_model.dart';
import '../../models/shipment_model.dart';
import '../../services/api_service.dart';
import '../../widgets/enterprise_widgets.dart';
import '../../theme/app_theme.dart';
import '../../layout/app_layout.dart';
import '../../layout/sidebar.dart';

class WarehouseDashboard extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const WarehouseDashboard({
    super.key,
    this.userInfo,
  });

  @override
  State<WarehouseDashboard> createState() => _WarehouseDashboardState();
}

class _WarehouseDashboardState extends State<WarehouseDashboard> {
  late Future<Map<String, dynamic>> _inventoryFuture;
  late Future<Map<String, dynamic>> _shipmentsFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _inventoryFuture = ApiService.getInventory(limit: 1000);
      _shipmentsFuture =
          ApiService.getRequest('get_shipments.php?limit=1000&offset=0');
    });
  }

  List<MenuItem> _getMenuItems() {
    return [
      MenuItem(
        label: 'Dashboard',
        icon: Icons.dashboard,
        route: '/warehouse_dashboard',
        isActive: true,
      ),
      MenuItem(
        label: 'Inventory',
        icon: Icons.warehouse,
        route: '/warehouse_dashboard',
      ),
      MenuItem(
        label: 'Shipments',
        icon: Icons.local_shipping,
        route: '/warehouse_dashboard',
      ),
      MenuItem(
        label: 'Orders',
        icon: Icons.receipt_long,
        route: '/warehouse_dashboard',
      ),
      MenuItem(
        label: 'Reports',
        icon: Icons.assessment,
        route: '/warehouse_dashboard',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return AppLayoutShell(
      userEmail: widget.userInfo?['email'] ?? 'warehouse@example.com',
      userRole: 'Warehouse Manager',
      onLogout: () {
        Navigator.pushReplacementNamed(context, '/login');
      },
      currentRoute: '/warehouse_dashboard',
      menuItems: _getMenuItems(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PageHeader(
            title: 'Warehouse Dashboard',
            subtitle: 'Inventory and Shipment Operations',
            actions: [
              SizedBox(
                width: 300,
                child: SearchField(
                  onChanged: (value) {},
                ),
              ),
              const SizedBox(width: AppTheme.spacingLg),
              ElevatedButton.icon(
                onPressed: _refreshData,
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh'),
              ),
            ],
          ),
          FutureBuilder<List<dynamic>>(
            future: Future.wait([_inventoryFuture, _shipmentsFuture]),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseLoadingWidget(
                    message: 'Loading dashboard...',
                  ),
                );
              }

              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseErrorWidget(
                    message: 'Failed to load data: ${snapshot.error}',
                    onRetry: _refreshData,
                  ),
                );
              }

              try {
                final results = snapshot.data as List<dynamic>;
                final inventoryData = results[0] as Map<String, dynamic>;
                final shipmentsData = results[1] as Map<String, dynamic>;

                final inventory =
                    (inventoryData['data'] as List<dynamic>?) ?? [];
                final shipments =
                    (shipmentsData['data'] as List<dynamic>?) ?? [];

                final lowStockItems = inventory.where((item) {
                  final current =
                      int.tryParse(item['current_stock'].toString()) ?? 0;
                  final min = int.tryParse(item['min_stock'].toString()) ?? 0;
                  return current <= min;
                }).length;

                final activeDeliveries = shipments
                    .where((s) =>
                        (s['type'] ?? '')
                            .toString()
                            .toLowerCase()
                            .contains('incoming') ||
                        (s['type'] ?? '')
                            .toString()
                            .toLowerCase()
                            .contains('outgoing'))
                    .length;

                final inventoryLevel = inventory.fold<int>(0, (sum, item) {
                  final value =
                      int.tryParse(item['current_stock'].toString()) ?? 0;
                  return sum + value;
                });

                return Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingXl),
                  child: GridView.count(
                    crossAxisCount:
                        MediaQuery.of(context).size.width > 1200 ? 4 : 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: AppTheme.spacingXl,
                    mainAxisSpacing: AppTheme.spacingXl,
                    childAspectRatio: 1.3,
                    children: [
                      StatsCard(
                        label: 'Total Products',
                        value: '${inventory.length}',
                        icon: Icons.inventory_2_outlined,
                        iconColor: AppTheme.primaryRed,
                        trend: '+3.5%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Low Stock Items',
                        value: '$lowStockItems',
                        icon: Icons.warning_amber_outlined,
                        iconColor: AppTheme.warningOrange,
                        trend: '-1.2%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Active Deliveries',
                        value: '$activeDeliveries',
                        icon: Icons.local_shipping_outlined,
                        iconColor: AppTheme.infoBlue,
                        trend: '+2.6%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Inventory Level',
                        value: '$inventoryLevel',
                        icon: Icons.warehouse_outlined,
                        iconColor: AppTheme.successGreen,
                        trend: 'live',
                        trendColor: AppTheme.textMedium,
                      ),
                    ],
                  ),
                );
              } catch (e) {
                return Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseErrorWidget(
                    message: 'Error processing data: $e',
                    onRetry: _refreshData,
                  ),
                );
              }
            },
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              0,
              AppTheme.spacingXl,
              AppTheme.spacingLg,
            ),
            child: ChartsPlaceholder(
              title: 'Warehouse Throughput',
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              AppTheme.spacingLg,
              AppTheme.spacingXl,
              AppTheme.spacingLg,
            ),
            child: DashboardCard(
              title: 'Inventory Status',
              actions: [
                TextButton.icon(
                  onPressed: _refreshData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ],
              child: FutureBuilder<Map<String, dynamic>>(
                future: _inventoryFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseLoadingWidget(
                        message: 'Loading inventory...',
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Failed to load inventory: ${snapshot.error}',
                        onRetry: _refreshData,
                      ),
                    );
                  }

                  try {
                    final data = snapshot.data ?? {};
                    final inventoryData =
                        (data['data'] as List<dynamic>?) ?? [];

                    if (inventoryData.isEmpty) {
                      return const EmptyStateWidget(
                        title: 'No Inventory Data',
                        message: 'Add inventory records to begin tracking.',
                        icon: Icons.warehouse_outlined,
                      );
                    }

                    final inventory = inventoryData
                        .map((json) =>
                            Inventory.fromJson(json as Map<String, dynamic>))
                        .toList();

                    return DataTableWidget(
                      title: 'Inventory',
                      embedded: true,
                      searchHint: 'Search product, SKU, or zone...',
                      searchIndex: inventory
                          .map((i) => '${i.productName} ${i.sku} ${i.zone}')
                          .toList(),
                      columns: const [
                        DataColumn(label: Text('Product')),
                        DataColumn(label: Text('SKU')),
                        DataColumn(label: Text('Zone')),
                        DataColumn(label: Text('Current')),
                        DataColumn(label: Text('Min/Max')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Last Updated')),
                      ],
                      rows: inventory.map((item) {
                        return DataRow(
                          cells: [
                            DataCell(Text(item.productName)),
                            DataCell(Text(item.sku)),
                            DataCell(Text(item.zone)),
                            DataCell(Text(item.currentStock.toString())),
                            DataCell(Text('${item.minStock}/${item.maxStock}')),
                            DataCell(
                              StatusBadge(
                                label: item.isLowStock ? 'Low Stock' : 'Normal',
                                backgroundColor: item.isLowStock
                                    ? AppTheme.warningOrange
                                    : AppTheme.successGreen,
                              ),
                            ),
                            DataCell(Text(
                              item.lastUpdated?.toString().split(' ')[0] ??
                                  'N/A',
                            )),
                          ],
                        );
                      }).toList(),
                    );
                  } catch (e) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Error parsing inventory: $e',
                        onRetry: _refreshData,
                      ),
                    );
                  }
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              AppTheme.spacingLg,
              AppTheme.spacingXl,
              AppTheme.spacingXl,
            ),
            child: DashboardCard(
              title: 'Shipments',
              actions: [
                TextButton.icon(
                  onPressed: _refreshData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ],
              child: FutureBuilder<Map<String, dynamic>>(
                future: _shipmentsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseLoadingWidget(
                        message: 'Loading shipments...',
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Failed to load shipments: ${snapshot.error}',
                        onRetry: _refreshData,
                      ),
                    );
                  }

                  try {
                    final data = snapshot.data ?? {};
                    final shipmentsData =
                        (data['data'] as List<dynamic>?) ?? [];

                    if (shipmentsData.isEmpty) {
                      return const EmptyStateWidget(
                        title: 'No Shipments',
                        message: 'No shipment records found.',
                        icon: Icons.local_shipping_outlined,
                      );
                    }

                    final shipments = shipmentsData
                        .map((json) =>
                            Shipment.fromJson(json as Map<String, dynamic>))
                        .toList();

                    return DataTableWidget(
                      title: 'Shipments',
                      embedded: true,
                      searchHint: 'Search shipment ID, supplier, or type...',
                      searchIndex: shipments
                          .map((s) => '${s.shipmentId} ${s.supplier} ${s.type}')
                          .toList(),
                      columns: const [
                        DataColumn(label: Text('Shipment ID')),
                        DataColumn(label: Text('Supplier')),
                        DataColumn(label: Text('Type')),
                        DataColumn(label: Text('Tracking')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Expected Date')),
                      ],
                      rows: shipments.map((shipment) {
                        return DataRow(
                          cells: [
                            DataCell(Text(shipment.shipmentId)),
                            DataCell(Text(shipment.supplier)),
                            DataCell(Text(shipment.type)),
                            DataCell(Text(shipment.trackingNumber ?? 'N/A')),
                            DataCell(
                              StatusBadge(
                                label: shipment.type,
                                backgroundColor: _getStatusColor(shipment.type),
                              ),
                            ),
                            DataCell(Text(shipment.expectedDate ?? 'N/A')),
                          ],
                        );
                      }).toList(),
                    );
                  } catch (e) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Error parsing shipments: $e',
                        onRetry: _refreshData,
                      ),
                    );
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingXl),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'incoming':
        return AppTheme.infoBlue;
      case 'outgoing':
        return AppTheme.warningOrange;
      default:
        return AppTheme.successGreen;
    }
  }
}
