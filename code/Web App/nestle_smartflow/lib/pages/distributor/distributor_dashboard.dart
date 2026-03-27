import 'package:flutter/material.dart';
import '../../models/order_model.dart';
import '../../services/api_service.dart';
import '../../widgets/enterprise_widgets.dart';
import '../../theme/app_theme.dart';
import '../../layout/app_layout.dart';
import '../../layout/sidebar.dart';

class DistributorDashboard extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const DistributorDashboard({
    super.key,
    this.userInfo,
  });

  @override
  State<DistributorDashboard> createState() => _DistributorDashboardState();
}

class _DistributorDashboardState extends State<DistributorDashboard> {
  late Future<Map<String, dynamic>> _ordersFuture;
  late Future<Map<String, dynamic>> _inventoryFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _ordersFuture = ApiService.getOrders(limit: 1000);
      _inventoryFuture = ApiService.getInventory(limit: 1000);
    });
  }

  List<MenuItem> _getMenuItems() {
    return [
      MenuItem(
        label: 'Dashboard',
        icon: Icons.dashboard,
        route: '/distributor_dashboard',
        isActive: true,
      ),
      MenuItem(
        label: 'Orders',
        icon: Icons.receipt_long,
        route: '/distributor_dashboard',
      ),
      MenuItem(
        label: 'Inventory',
        icon: Icons.warehouse,
        route: '/distributor_dashboard',
      ),
      MenuItem(
        label: 'Shipments',
        icon: Icons.local_shipping,
        route: '/distributor_dashboard',
      ),
      MenuItem(
        label: 'Reports',
        icon: Icons.bar_chart,
        route: '/distributor_dashboard',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return AppLayoutShell(
      userEmail: widget.userInfo?['email'] ?? 'distributor@example.com',
      userRole: 'Distributor',
      onLogout: () {
        Navigator.pushReplacementNamed(context, '/login');
      },
      currentRoute: '/distributor_dashboard',
      menuItems: _getMenuItems(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PageHeader(
            title: 'Distributor Dashboard',
            subtitle: 'Orders and Inventory Management',
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
            future: Future.wait([_ordersFuture, _inventoryFuture]),
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
                final ordersData = results[0] as Map<String, dynamic>;
                final inventoryData = results[1] as Map<String, dynamic>;

                final orders = (ordersData['data'] as List<dynamic>?) ?? [];
                final inventory =
                    (inventoryData['data'] as List<dynamic>?) ?? [];

                final pendingOrders = orders
                    .where((o) =>
                        (o['status'] ?? '').toString().toLowerCase() ==
                        'pending')
                    .length;

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
                        label: 'Total Orders',
                        value: '${orders.length}',
                        icon: Icons.receipt_long_outlined,
                        iconColor: AppTheme.primaryRed,
                        trend: '+8.2%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Pending Orders',
                        value: '$pendingOrders',
                        icon: Icons.schedule_outlined,
                        iconColor: AppTheme.warningOrange,
                        trend: '-2.1%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Total Inventory',
                        value: '${inventory.length}',
                        icon: Icons.warehouse_outlined,
                        iconColor: AppTheme.infoBlue,
                        trend: '+1.5%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Active Deliveries',
                        value:
                            '${orders.where((o) => (o['status'] ?? '').toString().toLowerCase().contains('ship')).length}',
                        icon: Icons.local_shipping_outlined,
                        iconColor: AppTheme.successGreen,
                        trend: '+12.5%',
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
              title: 'Orders and Delivery Trend',
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
              title: 'Recent Orders',
              actions: [
                TextButton.icon(
                  onPressed: _refreshData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ],
              child: FutureBuilder<Map<String, dynamic>>(
                future: _ordersFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseLoadingWidget(
                        message: 'Loading orders...',
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Failed to load orders: ${snapshot.error}',
                        onRetry: _refreshData,
                      ),
                    );
                  }

                  try {
                    final data = snapshot.data ?? {};
                    final ordersData = (data['data'] as List<dynamic>?) ?? [];

                    if (ordersData.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.all(AppTheme.spacingXl),
                        child: EmptyStateWidget(
                          title: 'No Orders',
                          message: 'Create your first order to get started.',
                          icon: Icons.receipt_long_outlined,
                          action: ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.add),
                            label: const Text('Create Order'),
                          ),
                        ),
                      );
                    }

                    final orders = ordersData
                        .map((json) =>
                            Order.fromJson(json as Map<String, dynamic>))
                        .toList();

                    return DataTableWidget(
                      title: 'Orders',
                      embedded: true,
                      searchHint: 'Search order ID, user, or status...',
                      searchIndex: orders
                          .map((o) => '${o.orderId} ${o.userId} ${o.status}')
                          .toList(),
                      columns: const [
                        DataColumn(label: Text('Order ID')),
                        DataColumn(label: Text('Date')),
                        DataColumn(label: Text('Total')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('User')),
                      ],
                      rows: orders.map((order) {
                        return DataRow(
                          cells: [
                            DataCell(Text(order.orderId.toString())),
                            DataCell(Text(
                              order.createdAt?.toString().split(' ')[0] ??
                                  'N/A',
                            )),
                            DataCell(Text(
                              '₨${order.totalAmount.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryRed,
                              ),
                            )),
                            DataCell(
                              StatusBadge(
                                label: order.status,
                                backgroundColor: _getStatusColor(order.status),
                                textColor: Colors.white,
                              ),
                            ),
                            DataCell(Text(order.userId.toString())),
                          ],
                        );
                      }).toList(),
                    );
                  } catch (e) {
                    return Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: EnterpriseErrorWidget(
                        message: 'Error parsing orders: $e',
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
      case 'pending':
        return AppTheme.warningOrange;
      case 'confirmed':
        return AppTheme.infoBlue;
      case 'shipped':
      case 'delivered':
        return AppTheme.successGreen;
      case 'cancelled':
        return AppTheme.dangerRed;
      default:
        return AppTheme.textMedium;
    }
  }
}
