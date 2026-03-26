import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class TopNavigationBar extends StatelessWidget {
  final String userEmail;
  final String userRole;
  final VoidCallback onLogout;
  final bool showMenuButton;
  final VoidCallback? onMenuPressed;

  const TopNavigationBar({
    super.key,
    required this.userEmail,
    required this.userRole,
    required this.onLogout,
    this.showMenuButton = false,
    this.onMenuPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 78,
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingXl,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppTheme.border),
        ),
      ),
      child: Row(
        children: [
          if (showMenuButton)
            IconButton(
              onPressed: onMenuPressed,
              icon: const Icon(Icons.menu),
              tooltip: 'Toggle navigation',
            ),
          const SizedBox(width: AppTheme.spacingSm),
          const Text(
            'Nestle SmartFlow',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.textDark,
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('No new notifications')),
              );
            },
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: 'Notifications',
          ),
          const SizedBox(width: AppTheme.spacingMd),
          CircleAvatar(
            backgroundColor: AppTheme.primaryRed.withOpacity(0.12),
            foregroundColor: AppTheme.primaryRed,
            child: const Icon(Icons.person_outline),
          ),
          const SizedBox(width: AppTheme.spacingSm),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                userRole,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textDark,
                ),
              ),
              SizedBox(
                width: 180,
                child: Text(
                  userEmail,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.textMedium,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: AppTheme.spacingLg),
          OutlinedButton.icon(
            onPressed: onLogout,
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Logout'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryRed,
              side: const BorderSide(color: AppTheme.primaryRed),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PageHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> actions;

  const PageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.actions = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      runSpacing: AppTheme.spacingLg,
      spacing: AppTheme.spacingLg,
      crossAxisAlignment: WrapCrossAlignment.center,
      alignment: WrapAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppTheme.spacingXs),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
        Wrap(
          spacing: AppTheme.spacingMd,
          runSpacing: AppTheme.spacingSm,
          children: actions,
        ),
      ],
    );
  }
}

class StatsCard extends StatefulWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconColor;
  final String? trend;
  final Color? trendColor;
  final Color? backgroundColor;

  const StatsCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.iconColor = AppTheme.primaryRed,
    this.trend,
    this.trendColor,
    this.backgroundColor,
  });

  @override
  State<StatsCard> createState() => _StatsCardState();
}

class _StatsCardState extends State<StatsCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        transform: Matrix4.translationValues(0, _hovered ? -2 : 0, 0),
        decoration: BoxDecoration(
          color: widget.backgroundColor ?? Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(_hovered ? 0.10 : 0.06),
              blurRadius: _hovered ? 20 : 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacingSm),
                  decoration: BoxDecoration(
                    color: widget.iconColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Icon(
                    widget.icon,
                    color: widget.iconColor,
                    size: 20,
                  ),
                ),
                const Spacer(),
                if (widget.trend != null)
                  Text(
                    widget.trend!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: widget.trendColor ?? AppTheme.infoBlue,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingLg),
            Text(
              widget.value,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: AppTheme.spacingXs),
            Text(
              widget.label,
              style: const TextStyle(
                color: AppTheme.textMedium,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardCard extends StatelessWidget {
  final String title;
  final Widget child;
  final List<Widget> actions;

  const DashboardCard({
    super.key,
    required this.title,
    required this.child,
    this.actions = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppTheme.spacingLg,
              AppTheme.spacingLg,
              AppTheme.spacingLg,
              AppTheme.spacingMd,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textDark,
                    ),
                  ),
                ),
                Wrap(spacing: AppTheme.spacingSm, children: actions),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),
          child,
        ],
      ),
    );
  }
}

class SearchField extends StatelessWidget {
  final ValueChanged<String>? onChanged;
  final String hint;

  const SearchField({
    super.key,
    this.onChanged,
    this.hint = 'Search records...',
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search),
      ),
    );
  }
}

class DataTableWidget extends StatefulWidget {
  final String title;
  final List<DataColumn> columns;
  final List<DataRow> rows;
  final List<String> searchIndex;
  final String searchHint;
  final int rowsPerPage;
  final bool embedded;

  const DataTableWidget({
    super.key,
    required this.title,
    required this.columns,
    required this.rows,
    this.searchIndex = const [],
    this.searchHint = 'Search records...',
    this.rowsPerPage = 8,
    this.embedded = false,
  });

  @override
  State<DataTableWidget> createState() => _DataTableWidgetState();
}

class _DataTableWidgetState extends State<DataTableWidget> {
  String _query = '';
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final indexed = List<int>.generate(widget.rows.length, (i) => i).where((i) {
      if (_query.isEmpty) return true;
      if (widget.searchIndex.length <= i) return true;
      return widget.searchIndex[i].toLowerCase().contains(_query.toLowerCase());
    }).toList();

    final start = _page * widget.rowsPerPage;
    final end = (start + widget.rowsPerPage).clamp(0, indexed.length);
    final visible = indexed.sublist(start.clamp(0, indexed.length), end);

    final canPrev = _page > 0;
    final canNext = end < indexed.length;

    final content = Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(AppTheme.spacingLg),
          child: Align(
            alignment: Alignment.centerRight,
            child: SizedBox(
              width: 280,
              child: SearchField(
                hint: widget.searchHint,
                onChanged: (value) {
                  setState(() {
                    _query = value;
                    _page = 0;
                  });
                },
              ),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.only(
            left: AppTheme.spacingLg,
            right: AppTheme.spacingLg,
            bottom: AppTheme.spacingLg,
          ),
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(AppTheme.lightGray),
            headingRowHeight: 56,
            dataRowHeight: 58,
            columnSpacing: 24,
            columns: widget.columns,
            rows: visible.map((i) {
              return DataRow(
                cells: widget.rows[i].cells,
                color: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.hovered)) {
                    return AppTheme.lightGray;
                  }
                  return null;
                }),
              );
            }).toList(),
          ),
        ),
        const Divider(height: 1, color: AppTheme.border),
        Padding(
          padding: const EdgeInsets.all(AppTheme.spacingMd),
          child: Row(
            children: [
              Text(
                'Showing ${indexed.isEmpty ? 0 : start + 1} - $end of ${indexed.length}',
                style: const TextStyle(color: AppTheme.textMedium),
              ),
              const Spacer(),
              IconButton(
                onPressed: canPrev ? () => setState(() => _page -= 1) : null,
                icon: const Icon(Icons.chevron_left),
              ),
              IconButton(
                onPressed: canNext ? () => setState(() => _page += 1) : null,
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        ),
      ],
    );

    if (widget.embedded) {
      return content;
    }

    return DashboardCard(
      title: widget.title,
      child: content,
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingMd,
        vertical: AppTheme.spacingSm,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}

class EmptyStateWidget extends StatelessWidget {
  final String title;
  final String message;
  final IconData icon;
  final Widget? action;

  const EmptyStateWidget({
    super.key,
    required this.title,
    required this.message,
    required this.icon,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing2xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: AppTheme.textMedium),
            const SizedBox(height: AppTheme.spacingMd),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppTheme.spacingSm),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textMedium),
            ),
            if (action != null) ...[
              const SizedBox(height: AppTheme.spacingLg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class EnterpriseLoadingWidget extends StatelessWidget {
  final String message;

  const EnterpriseLoadingWidget({
    super.key,
    this.message = 'Loading...',
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const LoadingIndicator(),
          const SizedBox(height: AppTheme.spacingMd),
          Text(
            message,
            style: const TextStyle(color: AppTheme.textMedium),
          ),
        ],
      ),
    );
  }
}

class EnterpriseErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const EnterpriseErrorWidget({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: AppTheme.dangerRed, size: 48),
          const SizedBox(height: AppTheme.spacingMd),
          const Text(
            'Failed to load data',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: AppTheme.spacingSm),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingXl),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textMedium),
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: AppTheme.spacingLg),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ],
      ),
    );
  }
}

class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 34,
      width: 34,
      child: CircularProgressIndicator(
        strokeWidth: 3,
        color: AppTheme.primaryRed,
      ),
    );
  }
}

class ChartsPlaceholder extends StatelessWidget {
  final String title;

  const ChartsPlaceholder({
    super.key,
    this.title = 'Operational Analytics',
  });

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      title: title,
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Container(
          height: 220,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            border: Border.all(color: AppTheme.border),
            gradient: const LinearGradient(
              colors: [Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  child: CustomPaint(
                    painter: _ChartGridPainter(),
                  ),
                ),
              ),
              const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.bar_chart, size: 40, color: AppTheme.textMedium),
                    SizedBox(height: AppTheme.spacingSm),
                    Text(
                      'Charts will appear here as data grows',
                      style: TextStyle(color: AppTheme.textMedium),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChartGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.border
      ..strokeWidth = 1;

    for (int i = 1; i < 6; i++) {
      final dy = size.height * i / 6;
      canvas.drawLine(Offset(0, dy), Offset(size.width, dy), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
