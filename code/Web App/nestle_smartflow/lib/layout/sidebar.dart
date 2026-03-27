import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class MenuItem {
  final String label;
  final IconData icon;
  final String route;
  final bool isActive;

  MenuItem({
    required this.label,
    required this.icon,
    required this.route,
    this.isActive = false,
  });
}

class SidebarMenu extends StatelessWidget {
  final List<MenuItem> items;
  final bool collapsed;
  final ValueChanged<bool> onToggle;
  final String systemName;

  const SidebarMenu({
    super.key,
    required this.items,
    required this.collapsed,
    required this.onToggle,
    this.systemName = 'Nestle SmartFlow',
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      width: collapsed ? 82 : 248,
      decoration: const BoxDecoration(
        color: AppTheme.darkBlue,
        boxShadow: [
          BoxShadow(
            color: Color(0x1F000000),
            blurRadius: 16,
            offset: Offset(2, 0),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingLg,
            ),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Color(0x26FFFFFF)),
              ),
            ),
            child: collapsed
                ? Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        height: 36,
                        width: 36,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: AppTheme.primaryRed,
                        ),
                        child: const Icon(
                          Icons.hub_outlined,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacingSm),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 32,
                          minHeight: 32,
                        ),
                        onPressed: () => onToggle(!collapsed),
                        icon: const Icon(
                          Icons.menu_open,
                          color: Colors.white70,
                          size: 18,
                        ),
                        tooltip: 'Expand sidebar',
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Container(
                        height: 36,
                        width: 36,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: AppTheme.primaryRed,
                        ),
                        child: const Icon(
                          Icons.hub_outlined,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingMd),
                      const Expanded(
                        child: Text(
                          'Nestle SmartFlow',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => onToggle(!collapsed),
                        icon: const Icon(
                          Icons.menu,
                          color: Colors.white70,
                          size: 20,
                        ),
                        tooltip: 'Collapse sidebar',
                      ),
                    ],
                  ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(AppTheme.spacingMd),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 6),
              itemBuilder: (context, index) {
                final item = items[index];
                final active = item.isActive;

                return MouseRegion(
                  cursor: SystemMouseCursors.click,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    decoration: BoxDecoration(
                      color: active
                          ? AppTheme.primaryRed.withOpacity(0.2)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      border: active
                          ? Border.all(
                              color: AppTheme.primaryRed.withOpacity(0.8),
                            )
                          : null,
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                        onTap: () {
                          if (ModalRoute.of(context)?.settings.name !=
                              item.route) {
                            Navigator.pushReplacementNamed(context, item.route);
                          }
                        },
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: collapsed
                                ? AppTheme.spacingMd
                                : AppTheme.spacingLg,
                            vertical: AppTheme.spacingMd,
                          ),
                          child: Row(
                            mainAxisAlignment: collapsed
                                ? MainAxisAlignment.center
                                : MainAxisAlignment.start,
                            children: [
                              Icon(
                                item.icon,
                                color: active ? Colors.white : Colors.white70,
                                size: 20,
                              ),
                              if (!collapsed) ...[
                                const SizedBox(width: AppTheme.spacingMd),
                                Expanded(
                                  child: Text(
                                    item.label,
                                    style: TextStyle(
                                      color: active
                                          ? Colors.white
                                          : Colors.white70,
                                      fontWeight: active
                                          ? FontWeight.w600
                                          : FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
