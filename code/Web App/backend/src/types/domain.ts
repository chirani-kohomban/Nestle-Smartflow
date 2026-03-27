export const USER_ROLES = ["admin", "manager", "warehouse", "delivery", "retailer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TASK_TYPES = ["Pick", "Pack", "Receive", "Verify", "Dispatch"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_PRIORITIES = ["High", "Medium", "Low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["Pending", "In Progress", "On Hold", "Completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const ORDER_STATUSES = ["Pending", "Processing", "Ready to Dispatch", "Dispatched", "Delivered", "Cancelled", "On Hold"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_PRIORITIES = ["High", "Medium", "Low"] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export const DELIVERY_STATUSES = ["Pending", "In Transit", "Delivered", "Failed", "On Hold", "Returned"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_PRIORITIES = ["High", "Standard", "Low"] as const;
export type DeliveryPriority = (typeof DELIVERY_PRIORITIES)[number];

export const ROUTE_STATUSES = ["Not Started", "In Progress", "Completed", "Pending", "Cancelled", "Paused"] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const ROUTE_PRIORITIES = ["High Priority", "Standard"] as const;
export type RoutePriority = (typeof ROUTE_PRIORITIES)[number];

export type RouteStopStatus = "Not visited" | "Visited" | "Completed" | "Failed";
export type InventoryStatus = "In Stock" | "Low Stock" | "Critical" | "Out of Stock";
export type RetailInventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type Severity = "info" | "warning" | "critical";
export type GoodSeverity = "good" | "warning" | "critical";
export type PaymentMethod = "Cash" | "Card" | "Digital Wallet" | "Mixed Payment";

export interface JwtUserPayload {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
  company: string;
  phone: string;
}

export interface AuthenticatedUser extends JwtUserPayload {
  tokenId?: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}