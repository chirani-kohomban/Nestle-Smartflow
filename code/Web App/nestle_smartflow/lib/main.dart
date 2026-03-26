import 'package:flutter/material.dart';
import 'pages/login_page.dart';
import 'pages/register_page.dart';
import 'pages/admin/admin_dashboard.dart';
import 'pages/manager/manager_dashboard.dart';
import 'pages/distributor/distributor_dashboard.dart';
import 'pages/retailer/retailer_dashboard.dart';
import 'pages/cashier/cashier_dashboard.dart';
import 'pages/warehouse/warehouse_dashboard.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const NestleSmartFlowApp());
}

class NestleSmartFlowApp extends StatelessWidget {
  const NestleSmartFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    final initialRoute =
        WidgetsBinding.instance.platformDispatcher.defaultRouteName;

    return MaterialApp(
      title: 'Nestle SmartFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: initialRoute,
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/admin_dashboard': (context) => AdminDashboard(
              userInfo: ModalRoute.of(context)?.settings.arguments
                  as Map<String, dynamic>?,
            ),
        '/manager_dashboard': (context) => ManagerDashboard(
              userInfo: ModalRoute.of(context)?.settings.arguments
                  as Map<String, dynamic>?,
            ),
        '/distributor_dashboard': (context) => DistributorDashboard(
              userInfo: ModalRoute.of(context)?.settings.arguments
                  as Map<String, dynamic>?,
            ),
        '/retailer_dashboard': (context) => RetailerDashboard(
              userInfo: ModalRoute.of(context)?.settings.arguments
                  as Map<String, dynamic>?,
            ),
        '/cashier_dashboard': (context) => CashierDashboard(
              userInfo: ModalRoute.of(context)?.settings.arguments
                  as Map<String, dynamic>?,
            ),
        '/warehouse_dashboard': (context) => WarehouseDashboard(
              userInfo: ModalRoute.of(context)?.settings.arguments
                  as Map<String, dynamic>?,
            ),
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkApiAndNavigate();
  }

  Future<void> _checkApiAndNavigate() async {
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    // Check API health
    final isHealthy = await ApiService.checkApiHealth();

    if (isHealthy) {
      debugPrint('✅ API is healthy, navigating to login');
    } else {
      debugPrint('⚠️ API health check failed, but continuing to login');
    }

    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE1261C),
              Color(0xFF1F2A44),
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo/App Icon
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.2),
                ),
                child: const Icon(
                  Icons.shopping_bag,
                  size: 64,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),

              // App Title
              const Text(
                'Nestle SmartFlow',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),

              // Subtitle
              const Text(
                'Supply Chain Management System',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 48),

              // Loading indicator
              const SizedBox(
                height: 40,
                width: 40,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 3,
                ),
              ),
              const SizedBox(height: 24),

              // Loading text
              const Text(
                'Initializing System...',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
