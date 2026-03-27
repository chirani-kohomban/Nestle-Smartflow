class UserRoleOption {
  final String value;
  final String label;
  final String dashboardRoute;

  const UserRoleOption({
    required this.value,
    required this.label,
    required this.dashboardRoute,
  });
}

const List<UserRoleOption> supportedRegistrationRoles = [
  UserRoleOption(
    value: 'admin',
    label: 'Admin',
    dashboardRoute: '/admin_dashboard',
  ),
  UserRoleOption(
    value: 'manager',
    label: 'Manager',
    dashboardRoute: '/manager_dashboard',
  ),
  UserRoleOption(
    value: 'distributor',
    label: 'Distributor',
    dashboardRoute: '/distributor_dashboard',
  ),
  UserRoleOption(
    value: 'cashier',
    label: 'Cashier',
    dashboardRoute: '/cashier_dashboard',
  ),
  UserRoleOption(
    value: 'warehouse_staff',
    label: 'Warehouse Staff',
    dashboardRoute: '/warehouse_dashboard',
  ),
];

String dashboardRouteForRole(String role) {
  final normalizedRole = role.trim().toLowerCase();

  for (final option in supportedRegistrationRoles) {
    if (option.value == normalizedRole) {
      return option.dashboardRoute;
    }
  }

  if (normalizedRole == 'warehouse') {
    return '/warehouse_dashboard';
  }

  if (normalizedRole == 'retailer') {
    return '/retailer_dashboard';
  }

  return '/login';
}

String labelForRole(String role) {
  final normalizedRole = role.trim().toLowerCase();

  for (final option in supportedRegistrationRoles) {
    if (option.value == normalizedRole) {
      return option.label;
    }
  }

  if (normalizedRole == 'retailer') {
    return 'Retailer';
  }

  return role;
}

bool isSupportedRegistrationRole(String role) {
  final normalizedRole = role.trim().toLowerCase();
  return supportedRegistrationRoles
      .any((option) => option.value == normalizedRole);
}
