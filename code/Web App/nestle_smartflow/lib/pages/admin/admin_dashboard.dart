import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../widgets/enterprise_widgets.dart';
import '../../theme/app_theme.dart';
import '../../layout/app_layout.dart';
import '../../layout/sidebar.dart';

class AdminDashboard extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const AdminDashboard({
    super.key,
    this.userInfo,
  });

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  late Future<Map<String, dynamic>> _usersFuture;
  late Future<Map<String, dynamic>> _statusFuture;
  late Future<Map<String, dynamic>> _ordersFuture;
  late Future<Map<String, dynamic>> _inventoryFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _usersFuture = ApiService.getUsers(limit: 1000);
      _statusFuture = ApiService.getApiStatus();
      _ordersFuture = ApiService.getOrders(limit: 1000);
      _inventoryFuture = ApiService.getInventory(limit: 1000);
    });
  }

  List<MenuItem> _getMenuItems() {
    return [
      MenuItem(
        label: 'Dashboard',
        icon: Icons.dashboard,
        route: '/admin_dashboard',
        isActive: true,
      ),
      MenuItem(
        label: 'Products',
        icon: Icons.shopping_bag,
        route: '/admin_dashboard',
      ),
      MenuItem(
        label: 'Inventory',
        icon: Icons.warehouse,
        route: '/admin_dashboard',
      ),
      MenuItem(
        label: 'Shipments',
        icon: Icons.local_shipping,
        route: '/admin_dashboard',
      ),
      MenuItem(
        label: 'Orders',
        icon: Icons.receipt_long,
        route: '/admin_dashboard',
      ),
      MenuItem(
        label: 'Reports',
        icon: Icons.bar_chart,
        route: '/admin_dashboard',
      ),
      MenuItem(
        label: 'Users',
        icon: Icons.group,
        route: '/admin_dashboard',
      ),
      MenuItem(
        label: 'Settings',
        icon: Icons.settings,
        route: '/admin_dashboard',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return AppLayoutShell(
      userEmail: widget.userInfo?['email'] ?? 'admin@nestle.com',
      userRole: 'Admin',
      currentRoute: '/admin_dashboard',
      onLogout: () {
        Navigator.pushReplacementNamed(context, '/login');
      },
      menuItems: _getMenuItems(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PageHeader(
            title: 'Admin Dashboard',
            subtitle: 'Enterprise overview of users, inventory, and operations',
            actions: [
              ElevatedButton.icon(
                onPressed: _refreshData,
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh'),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingXl),
          FutureBuilder<List<dynamic>>(
            future: Future.wait([
              _statusFuture,
              _ordersFuture,
              _inventoryFuture,
            ]),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseLoadingWidget(
                    message: 'Loading system metrics...',
                  ),
                );
              }

              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseErrorWidget(
                    message: 'Failed to load metrics: ${snapshot.error}',
                    onRetry: _refreshData,
                  ),
                );
              }

              final results = snapshot.data ?? [];
              final status = results[0] as Map<String, dynamic>;
              final ordersData = results[1] as Map<String, dynamic>;
              final inventoryData = results[2] as Map<String, dynamic>;

              final totalProducts = (status['products'] ?? 0) as int;
              final totalOrders = (status['orders'] ?? 0) as int;

              final orders = (ordersData['data'] as List<dynamic>?) ?? [];
              final inventory = (inventoryData['data'] as List<dynamic>?) ?? [];

              final activeDeliveries = orders
                  .where((o) => (o['order_status'] ?? '')
                      .toString()
                      .toLowerCase()
                      .contains('ship'))
                  .length;

              final inventoryLevel = inventory.isEmpty
                  ? 0
                  : inventory.fold<int>(0, (sum, item) {
                      final value = int.tryParse(
                            item['current_stock'].toString(),
                          ) ??
                          0;
                      return sum + value;
                    });

              return GridView.count(
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
                    value: '$totalProducts',
                    icon: Icons.shopping_bag_outlined,
                    iconColor: AppTheme.primaryRed,
                    trend: '+2.0%',
                    trendColor: AppTheme.successGreen,
                  ),
                  StatsCard(
                    label: 'Total Orders',
                    value: '$totalOrders',
                    icon: Icons.receipt_long_outlined,
                    iconColor: AppTheme.infoBlue,
                    trend: '+6.4%',
                    trendColor: AppTheme.successGreen,
                  ),
                  StatsCard(
                    label: 'Active Deliveries',
                    value: '$activeDeliveries',
                    icon: Icons.local_shipping_outlined,
                    iconColor: AppTheme.successGreen,
                    trend: '+1.8%',
                    trendColor: AppTheme.successGreen,
                  ),
                  StatsCard(
                    label: 'Inventory Level',
                    value: '$inventoryLevel',
                    icon: Icons.warehouse_outlined,
                    iconColor: AppTheme.warningOrange,
                    trend: 'live',
                    trendColor: AppTheme.textMedium,
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppTheme.spacingXl),
          const ChartsPlaceholder(
            title: 'Executive Operations Summary',
          ),
          const SizedBox(height: AppTheme.spacingXl),
          FutureBuilder<Map<String, dynamic>>(
            future: _usersFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseLoadingWidget(
                    message: 'Loading users...',
                  ),
                );
              }

              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseErrorWidget(
                    message: 'Failed to load users: ${snapshot.error}',
                    onRetry: _refreshData,
                  ),
                );
              }

              try {
                final data = snapshot.data ?? {};
                final usersData = (data['data'] as List<dynamic>?) ?? [];

                if (usersData.isEmpty) {
                  return const EmptyStateWidget(
                    title: 'No Users Found',
                    message: 'Create users to start role-based operations.',
                    icon: Icons.group_outlined,
                  );
                }

                final users = usersData
                    .map((json) => User.fromJson(json as Map<String, dynamic>))
                    .toList();

                return DataTableWidget(
                  title: 'Users Management',
                  searchHint: 'Search by name, email, or role...',
                  searchIndex: users
                      .map((u) => '${u.username} ${u.email} ${u.role}')
                      .toList(),
                  columns: const [
                    DataColumn(label: Text('ID')),
                    DataColumn(label: Text('User')),
                    DataColumn(label: Text('Email')),
                    DataColumn(label: Text('Role')),
                    DataColumn(label: Text('Actions')),
                  ],
                  rows: users.map((user) {
                    return DataRow(
                      cells: [
                        DataCell(Text(user.id.toString())),
                        DataCell(Text(user.username)),
                        DataCell(Text(user.email)),
                        DataCell(
                          StatusBadge(
                            label: user.role,
                            backgroundColor: AppTheme.darkBlue,
                          ),
                        ),
                        DataCell(
                          Wrap(
                            spacing: AppTheme.spacingSm,
                            children: [
                              OutlinedButton(
                                onPressed: () {},
                                child: const Text('View'),
                              ),
                              ElevatedButton(
                                onPressed: () {},
                                child: const Text('Edit'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                );
              } catch (e) {
                return Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingXl),
                  child: EnterpriseErrorWidget(
                    message: 'Error parsing users: $e',
                    onRetry: _refreshData,
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
