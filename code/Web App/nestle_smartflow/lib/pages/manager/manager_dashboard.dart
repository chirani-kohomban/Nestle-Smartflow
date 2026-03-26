import 'package:flutter/material.dart';
import '../../models/inventory_model.dart';
import '../../models/product_model.dart';
import '../../services/api_service.dart';
import '../../widgets/enterprise_widgets.dart';
import '../../theme/app_theme.dart';
import '../../layout/app_layout.dart';
import '../../layout/sidebar.dart';

class ManagerDashboard extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const ManagerDashboard({
    super.key,
    this.userInfo,
  });

  @override
  State<ManagerDashboard> createState() => _ManagerDashboardState();
}

class _ManagerDashboardState extends State<ManagerDashboard> {
  late Future<Map<String, dynamic>> _inventoryFuture;
  late Future<Map<String, dynamic>> _productsFuture;
  late Future<Map<String, dynamic>> _ordersFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _inventoryFuture = ApiService.getInventory(limit: 1000);
      _productsFuture = ApiService.getProducts(limit: 1000);
      _ordersFuture = ApiService.getOrders(limit: 1000);
    });
  }

  List<MenuItem> _getMenuItems() {
    return [
      MenuItem(
        label: 'Dashboard',
        icon: Icons.dashboard,
        route: '/manager_dashboard',
        isActive: true,
      ),
      MenuItem(
        label: 'Products',
        icon: Icons.shopping_bag,
        route: '/manager_dashboard',
      ),
      MenuItem(
        label: 'Inventory',
        icon: Icons.warehouse,
        route: '/manager_dashboard',
      ),
      MenuItem(
        label: 'Shipments',
        icon: Icons.local_shipping,
        route: '/manager_dashboard',
      ),
      MenuItem(
        label: 'Orders',
        icon: Icons.receipt_long,
        route: '/manager_dashboard',
      ),
      MenuItem(
        label: 'Reports',
        icon: Icons.bar_chart,
        route: '/manager_dashboard',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return AppLayoutShell(
      userEmail: widget.userInfo?['email'] ?? 'manager@example.com',
      userRole: 'Manager',
      onLogout: () {
        Navigator.pushReplacementNamed(context, '/login');
      },
      currentRoute: '/manager_dashboard',
      menuItems: _getMenuItems(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PageHeader(
            title: 'Manager Dashboard',
            subtitle: 'Inventory, Products, and Orders Management',
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
          // Summary Cards
          FutureBuilder<List<dynamic>>(
            future: Future.wait([
              _inventoryFuture,
              _productsFuture,
              _ordersFuture,
            ]),
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
                final productsData = results[1] as Map<String, dynamic>;
                final ordersData = results[2] as Map<String, dynamic>;

                final inventory =
                    (inventoryData['data'] as List<dynamic>?) ?? [];
                final products = (productsData['data'] as List<dynamic>?) ?? [];
                final orders = (ordersData['data'] as List<dynamic>?) ?? [];

                final lowStockCount = inventory.where((item) {
                  final current =
                      int.tryParse(item['current_stock'].toString()) ?? 0;
                  final min = int.tryParse(item['min_stock'].toString()) ?? 0;
                  return current <= min;
                }).length;

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
                        value: '${products.length}',
                        icon: Icons.shopping_bag_outlined,
                        iconColor: AppTheme.primaryRed,
                        trend: '+2.5%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Total Inventory',
                        value: '${inventory.length}',
                        icon: Icons.warehouse_outlined,
                        iconColor: AppTheme.infoBlue,
                        trend: '+1.2%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Low Stock Items',
                        value: '$lowStockCount',
                        icon: Icons.warning_outlined,
                        iconColor: AppTheme.warningOrange,
                        trend: '-0.5%',
                        trendColor: AppTheme.dangerRed,
                      ),
                      StatsCard(
                        label: 'Total Orders',
                        value: '${orders.length}',
                        icon: Icons.receipt_long_outlined,
                        iconColor: AppTheme.successGreen,
                        trend: '+5.8%',
                        trendColor: AppTheme.successGreen,
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
              title: 'Supply Chain Performance',
            ),
          ),
          // Products Section
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              AppTheme.spacingLg,
              AppTheme.spacingXl,
              AppTheme.spacingLg,
            ),
            child: DashboardCard(
              title: 'Products Catalog',
              actions: [
                TextButton.icon(
                  onPressed: _refreshData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ],
              child: FutureBuilder<Map<String, dynamic>>(
                future: _productsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseLoadingWidget(
                        message: 'Loading products...',
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Failed to load products: ${snapshot.error}',
                        onRetry: _refreshData,
                      ),
                    );
                  }

                  try {
                    final data = snapshot.data ?? {};
                    final productsData = (data['data'] as List<dynamic>?) ?? [];

                    if (productsData.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.all(AppTheme.spacingXl),
                        child: EmptyStateWidget(
                          title: 'No Products Found',
                          message: 'Create a new product to get started.',
                          icon: Icons.shopping_bag_outlined,
                          action: ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.add),
                            label: const Text('Add Product'),
                          ),
                        ),
                      );
                    }

                    final products = productsData
                        .map((json) =>
                            Product.fromJson(json as Map<String, dynamic>))
                        .toList();

                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingLg),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columnSpacing: 24,
                          headingRowColor: WidgetStateProperty.all(
                            AppTheme.lightGray,
                          ),
                          headingRowHeight: 56,
                          dataRowHeight: 56,
                          columns: const [
                            DataColumn(label: Text('Product Name')),
                            DataColumn(label: Text('SKU')),
                            DataColumn(label: Text('Category')),
                            DataColumn(label: Text('Price')),
                          ],
                          rows: products.map((product) {
                            return DataRow(
                              cells: [
                                DataCell(Text(product.name)),
                                DataCell(Text(product.sku)),
                                DataCell(Text(product.category ?? 'N/A')),
                                DataCell(Text(
                                  '₨${product.price.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryRed,
                                  ),
                                )),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    );
                  } catch (e) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Error parsing products: $e',
                        onRetry: _refreshData,
                      ),
                    );
                  }
                },
              ),
            ),
          ),
          // Inventory Section
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              AppTheme.spacingLg,
              AppTheme.spacingXl,
              AppTheme.spacingXl,
            ),
            child: DashboardCard(
              title: 'Stock Levels Overview',
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
                      return const Padding(
                        padding: EdgeInsets.all(AppTheme.spacingXl),
                        child: EmptyStateWidget(
                          title: 'No Inventory Data',
                          message: 'Add inventory items to track stock levels.',
                          icon: Icons.warehouse_outlined,
                        ),
                      );
                    }

                    final inventory = inventoryData
                        .map((json) =>
                            Inventory.fromJson(json as Map<String, dynamic>))
                        .toList();

                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingLg),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columnSpacing: 24,
                          headingRowColor: WidgetStateProperty.all(
                            AppTheme.lightGray,
                          ),
                          headingRowHeight: 56,
                          dataRowHeight: 56,
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
                                DataCell(Text(
                                  item.currentStock.toString(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                )),
                                DataCell(
                                  Text('${item.minStock}/${item.maxStock}'),
                                ),
                                DataCell(
                                  StatusBadge(
                                    label: item.isLowStock
                                        ? 'Low Stock'
                                        : 'Normal',
                                    backgroundColor: item.isLowStock
                                        ? AppTheme.warningOrange
                                        : AppTheme.successGreen,
                                    textColor: Colors.white,
                                  ),
                                ),
                                DataCell(Text(
                                  item.lastUpdated?.toString().split(' ')[0] ??
                                      'N/A',
                                )),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
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
          const SizedBox(height: AppTheme.spacingXl),
        ],
      ),
    );
  }
}
