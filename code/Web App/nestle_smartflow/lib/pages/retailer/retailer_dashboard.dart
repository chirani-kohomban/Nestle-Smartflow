import 'package:flutter/material.dart';
import '../../models/product_model.dart';
import '../../models/order_model.dart';
import '../../services/api_service.dart';
import '../../widgets/enterprise_widgets.dart';
import '../../theme/app_theme.dart';
import '../../layout/app_layout.dart';
import '../../layout/sidebar.dart';

class RetailerDashboard extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const RetailerDashboard({
    super.key,
    this.userInfo,
  });

  @override
  State<RetailerDashboard> createState() => _RetailerDashboardState();
}

class _RetailerDashboardState extends State<RetailerDashboard> {
  late Future<Map<String, dynamic>> _productsFuture;
  late Future<Map<String, dynamic>> _ordersFuture;
  final Map<int, int> _cartItems = {};
  double _cartTotal = 0;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _productsFuture = ApiService.getProducts(limit: 1000);
      _ordersFuture = ApiService.getOrders(
        limit: 100,
        userId: widget.userInfo?['id'],
      );
    });
  }

  void _addToCart(Product product) {
    setState(() {
      _cartItems[product.id] = (_cartItems[product.id] ?? 0) + 1;
      _cartTotal += product.price;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} added to cart'),
        backgroundColor: AppTheme.successGreen,
      ),
    );
  }


  List<MenuItem> _getMenuItems() {
    return [
      MenuItem(
        label: 'Dashboard',
        icon: Icons.dashboard,
        route: '/retailer_dashboard',
        isActive: true,
      ),
      MenuItem(
        label: 'Products',
        icon: Icons.shopping_bag,
        route: '/retailer_dashboard',
      ),
      MenuItem(
        label: 'Orders',
        icon: Icons.receipt_long,
        route: '/retailer_dashboard',
      ),
      MenuItem(
        label: 'Cart',
        icon: Icons.shopping_cart,
        route: '/retailer_dashboard',
      ),
      MenuItem(
        label: 'Profile',
        icon: Icons.person,
        route: '/retailer_dashboard',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return AppLayoutShell(
      userEmail: widget.userInfo?['email'] ?? 'retailer@example.com',
      userRole: 'Retailer',
      onLogout: () {
        Navigator.pushReplacementNamed(context, '/login');
      },
      currentRoute: '/retailer_dashboard',
      menuItems: _getMenuItems(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PageHeader(
            title: 'Retail Store Dashboard',
            subtitle: 'Browse products and manage orders',
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
          // Summary Stats
          FutureBuilder<List<dynamic>>(
            future: Future.wait([_productsFuture, _ordersFuture]),
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
                final productsData = results[0] as Map<String, dynamic>;
                final ordersData = results[1] as Map<String, dynamic>;

                final products = (productsData['data'] as List<dynamic>?) ?? [];
                final orders = (ordersData['data'] as List<dynamic>?) ?? [];

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
                        label: 'Available Products',
                        value: '${products.length}',
                        icon: Icons.shopping_bag_outlined,
                        iconColor: AppTheme.primaryRed,
                        trend: '+5.2%',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Cart Items',
                        value: '${_cartItems.values.fold(0, (a, b) => a + b)}',
                        icon: Icons.shopping_cart_outlined,
                        iconColor: AppTheme.infoBlue,
                        trend: '+${_cartItems.length}',
                        trendColor: AppTheme.infoBlue,
                      ),
                      StatsCard(
                        label: 'Your Orders',
                        value: '${orders.length}',
                        icon: Icons.receipt_long_outlined,
                        iconColor: AppTheme.warningOrange,
                        trend: '+2 recent',
                        trendColor: AppTheme.successGreen,
                      ),
                      StatsCard(
                        label: 'Cart Total',
                        value: '₨${_cartTotal.toStringAsFixed(2)}',
                        icon: Icons.account_balance_wallet_outlined,
                        iconColor: AppTheme.successGreen,
                        backgroundColor:
                            AppTheme.successGreen.withOpacity(0.05),
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
              title: 'Retail Demand Snapshot',
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
              title: 'Available Products',
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
                      return const Padding(
                        padding: EdgeInsets.all(AppTheme.spacingXl),
                        child: EmptyStateWidget(
                          title: 'No Products Available',
                          message: 'Check back soon for new products.',
                          icon: Icons.shopping_bag_outlined,
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
                            DataColumn(label: Text('Action')),
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
                                DataCell(
                                  ElevatedButton(
                                    onPressed: () => _addToCart(product),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.successGreen,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppTheme.spacingMd,
                                        vertical: AppTheme.spacingSm,
                                      ),
                                    ),
                                    child: const Text(
                                      'Add to Cart',
                                      style: TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ),
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
          // Your Orders Section
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              AppTheme.spacingLg,
              AppTheme.spacingXl,
              AppTheme.spacingXl,
            ),
            child: DashboardCard(
              title: 'Your Order History',
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
                        message: 'Loading your orders...',
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
                      return const Padding(
                        padding: EdgeInsets.all(AppTheme.spacingXl),
                        child: EmptyStateWidget(
                          title: 'No Orders Yet',
                          message: 'Start shopping to place your first order.',
                          icon: Icons.receipt_long_outlined,
                        ),
                      );
                    }

                    final orders = ordersData
                        .map((json) =>
                            Order.fromJson(json as Map<String, dynamic>))
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
                            DataColumn(label: Text('Order ID')),
                            DataColumn(label: Text('Date')),
                            DataColumn(label: Text('Total')),
                            DataColumn(label: Text('Status')),
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
                                    backgroundColor:
                                        _getStatusColor(order.status),
                                    textColor: Colors.white,
                                  ),
                                ),
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
        return AppTheme.infoBlue;
      case 'delivered':
        return AppTheme.successGreen;
      case 'cancelled':
        return AppTheme.dangerRed;
      default:
        return AppTheme.textMedium;
    }
  }
}
