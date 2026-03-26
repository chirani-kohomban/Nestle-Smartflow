import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/enterprise_widgets.dart';
import 'sidebar.dart';

class AppLayoutShell extends StatefulWidget {
  final List<MenuItem> menuItems;
  final Widget child;
  final String userEmail;
  final String userRole;
  final String currentRoute;
  final VoidCallback onLogout;

  const AppLayoutShell({
    super.key,
    required this.menuItems,
    required this.child,
    required this.userEmail,
    required this.userRole,
    required this.currentRoute,
    required this.onLogout,
  });

  @override
  State<AppLayoutShell> createState() => _AppLayoutShellState();
}

class _AppLayoutShellState extends State<AppLayoutShell> {
  bool _collapsed = false;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 900;
    final isTablet = width >= 900 && width < 1200;

    if (!isTablet && _collapsed && !isMobile) {
      _collapsed = false;
    }

    if (isMobile) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        drawer: Drawer(
          child: SidebarMenu(
            items: widget.menuItems,
            collapsed: false,
            onToggle: (_) {},
          ),
        ),
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(78),
          child: Builder(
            builder: (innerContext) => TopNavigationBar(
              userEmail: widget.userEmail,
              userRole: widget.userRole,
              onLogout: widget.onLogout,
              showMenuButton: true,
              onMenuPressed: () => Scaffold.of(innerContext).openDrawer(),
            ),
          ),
        ),
        body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: SingleChildScrollView(
            key: ValueKey(widget.currentRoute),
            padding: const EdgeInsets.all(AppTheme.spacingLg),
            child: widget.child,
          ),
        ),
      );
    }

    if (isTablet) {
      _collapsed = true;
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Row(
        children: [
          SidebarMenu(
            items: widget.menuItems,
            collapsed: _collapsed,
            onToggle: (value) {
              setState(() {
                _collapsed = value;
              });
            },
          ),
          Expanded(
            child: Column(
              children: [
                TopNavigationBar(
                  userEmail: widget.userEmail,
                  userRole: widget.userRole,
                  onLogout: widget.onLogout,
                  showMenuButton: true,
                  onMenuPressed: () {
                    setState(() {
                      _collapsed = !_collapsed;
                    });
                  },
                ),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 260),
                    switchInCurve: Curves.easeOut,
                    switchOutCurve: Curves.easeIn,
                    child: SingleChildScrollView(
                      key: ValueKey(widget.currentRoute),
                      padding: const EdgeInsets.all(AppTheme.spacingXl),
                      child: widget.child,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
