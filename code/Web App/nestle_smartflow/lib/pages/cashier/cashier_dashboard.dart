import 'package:flutter/material.dart';
import '../../models/product_model.dart';
import '../../services/api_service.dart';
import '../../widgets/enterprise_widgets.dart';
import '../../theme/app_theme.dart';
import '../../layout/app_layout.dart';
import '../../layout/sidebar.dart';

class CashierDashboard extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const CashierDashboard({
    super.key,
    this.userInfo,
  });

  @override
  State<CashierDashboard> createState() => _CashierDashboardState();
}

class _CashierDashboardState extends State<CashierDashboard> {
  late Future<Map<String, dynamic>> _productsFuture;
  final Map<int, int> _cartItems = {};
  double _billAmount = 0;
  int _transactionCount = 0;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _productsFuture = ApiService.getProducts(limit: 1000);
    });
  }

  void _addProduct(Product product) {
    setState(() {
      _cartItems[product.id] = (_cartItems[product.id] ?? 0) + 1;
      _billAmount += product.price;
    });
  }

  void _processBill() {
    if (_cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cart is empty'),
          backgroundColor: AppTheme.warningOrange,
        ),
      );
      return;
    }

    setState(() {
      _transactionCount++;
      _cartItems.clear();
      _billAmount = 0;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Bill processed successfully'),
        backgroundColor: AppTheme.successGreen,
      ),
    );
  }

  List<MenuItem> _getMenuItems() {
    return [
      MenuItem(
        label: 'Dashboard',
        icon: Icons.dashboard,
        route: '/cashier_dashboard',
        isActive: true,
      ),
      MenuItem(
        label: 'POS',
        icon: Icons.credit_card,
        route: '/cashier_dashboard',
      ),
      MenuItem(
        label: 'Transactions',
        icon: Icons.history,
        route: '/cashier_dashboard',
      ),
      MenuItem(
        label: 'Reports',
        icon: Icons.assessment,
        route: '/cashier_dashboard',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return AppLayoutShell(
      userEmail: widget.userInfo?['email'] ?? 'cashier@example.com',
      userRole: 'Cashier',
      onLogout: () {
        Navigator.pushReplacementNamed(context, '/login');
      },
      currentRoute: '/cashier_dashboard',
      menuItems: _getMenuItems(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PageHeader(
            title: 'Cashier Dashboard',
            subtitle: 'POS and Transaction Management',
            actions: [
              ElevatedButton.icon(
                onPressed: _processBill,
                icon: const Icon(Icons.credit_card),
                label: const Text('Process Bill'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.successGreen,
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
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingXl),
            child: GridView.count(
              crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 4 : 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: AppTheme.spacingXl,
              mainAxisSpacing: AppTheme.spacingXl,
              childAspectRatio: 1.3,
              children: [
                StatsCard(
                  label: 'Current Bill',
                  value: '₨${_billAmount.toStringAsFixed(2)}',
                  icon: Icons.account_balance_wallet_outlined,
                  iconColor: AppTheme.successGreen,
                  backgroundColor: AppTheme.successGreen.withOpacity(0.05),
                ),
                StatsCard(
                  label: 'Cart Items',
                  value: '${_cartItems.values.fold(0, (a, b) => a + b)}',
                  icon: Icons.shopping_cart_outlined,
                  iconColor: AppTheme.primaryRed,
                  trend: '+${_cartItems.length}',
                  trendColor: AppTheme.primaryRed,
                ),
                StatsCard(
                  label: 'Transactions Today',
                  value: '$_transactionCount',
                  icon: Icons.receipt_long_outlined,
                  iconColor: AppTheme.infoBlue,
                  trend: '+$_transactionCount bills',
                  trendColor: AppTheme.infoBlue,
                ),
                const StatsCard(
                  label: 'Products Available',
                  value: '0',
                  icon: Icons.inventory_outlined,
                  iconColor: AppTheme.warningOrange,
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(
              AppTheme.spacingXl,
              0,
              AppTheme.spacingXl,
              AppTheme.spacingLg,
            ),
            child: ChartsPlaceholder(
              title: 'Billing Performance Overview',
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
                          message:
                              'No products available for sale at this moment.',
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
                                    onPressed: () => _addProduct(product),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryRed,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppTheme.spacingMd,
                                        vertical: AppTheme.spacingSm,
                                      ),
                                    ),
                                    child: const Text(
                                      'Add',
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
          const SizedBox(height: AppTheme.spacingXl),
        ],
      ),
    );
  }
}
