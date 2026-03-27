export class SingleRecordQuery<T> implements PromiseLike<T | null> {
  constructor(private readonly loader: (lean: boolean) => Promise<T | null>) {}

  lean() {
    return this.loader(true);
  }

  then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.loader(false).then(onfulfilled, onrejected);
  }
}

export class ManyRecordQuery<T> implements PromiseLike<T[]> {
  private sortBy?: Record<string, 1 | -1>;
  private limitBy?: number;

  constructor(private readonly loader: (options: { sort?: Record<string, 1 | -1>; limit?: number }, lean: boolean) => Promise<T[]>) {}

  sort(sortBy: Record<string, 1 | -1>) {
    this.sortBy = sortBy;
    return this;
  }

  limit(limitBy: number) {
    this.limitBy = limitBy;
    return this;
  }

  lean() {
    return this.loader({ sort: this.sortBy, limit: this.limitBy }, true);
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.loader({ sort: this.sortBy, limit: this.limitBy }, false).then(onfulfilled, onrejected);
  }
}

export function normalizeSort(sortBy?: Record<string, 1 | -1>) {
  if (!sortBy) {
    return undefined;
  }

  return Object.entries(sortBy).map(([key, direction]) => [key, direction === -1 ? "DESC" : "ASC"]);
}

export function asJson<T>(value: T | null | undefined, fallback: T): T {
  if (value == null) {
    return fallback;
  }

  return value;
}

export function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

export function toDate(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function attachDocument<T extends Record<string, unknown>>(document: T, id: number, save: () => Promise<void>) {
  Object.defineProperty(document, "_id", {
    value: id,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(document, "save", {
    value: async () => {
      await save();
      return document;
    },
    enumerable: false,
    configurable: true,
  });

  return document as T & { _id: number; save: () => Promise<T> };
}

export function roleToDatabase(role?: string | null) {
  if (!role) {
    return null;
  }

  return role === "warehouse" ? "warehouse_staff" : role;
}

export function roleFromDatabase(role?: string | null) {
  if (!role) {
    return null;
  }

  return role === "warehouse_staff" ? "warehouse" : role;
}

export function orderStatusToDatabase(status?: string | null) {
  const map: Record<string, string> = {
    Pending: "pending",
    Processing: "processing",
    "Ready to Dispatch": "ready_to_dispatch",
    Dispatched: "dispatched",
    Delivered: "delivered",
    Cancelled: "cancelled",
    "On Hold": "cancelled",
  };

  return status ? (map[status] ?? status.toLowerCase().replace(/\s+/g, "_")) : "pending";
}

export function orderStatusFromDatabase(status?: string | null) {
  const map: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    ready_to_dispatch: "Ready to Dispatch",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return status ? (map[status] ?? status) : "Pending";
}

export function taskStatusToDatabase(status?: string | null) {
  const map: Record<string, string> = {
    Pending: "pending",
    "In Progress": "in_progress",
    "On Hold": "on_hold",
    Completed: "completed",
    Cancelled: "cancelled",
  };

  return status ? (map[status] ?? status.toLowerCase().replace(/\s+/g, "_")) : "pending";
}

export function taskStatusFromDatabase(status?: string | null) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return status ? (map[status] ?? status) : "Pending";
}

export function taskPriorityToDatabase(priority?: string | null) {
  return priority ? priority.toLowerCase() : "medium";
}

export function taskPriorityFromDatabase(priority?: string | null) {
  return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Medium";
}

export function taskTypeToDatabase(type?: string | null) {
  return type ? type.toLowerCase() : "pick";
}

export function taskTypeFromDatabase(type?: string | null) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Pick";
}

export function deliveryStatusToDatabase(status?: string | null) {
  const map: Record<string, string> = {
    Pending: "pending",
    "In Transit": "in_transit",
    "Awaiting Handoff": "awaiting_handoff",
    Delivered: "delivered",
    Failed: "failed",
    Returned: "returned",
    "On Hold": "failed",
  };

  return status ? (map[status] ?? status.toLowerCase().replace(/\s+/g, "_")) : "pending";
}

export function deliveryStatusFromDatabase(status?: string | null) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_transit: "In Transit",
    awaiting_handoff: "Awaiting Handoff",
    delivered: "Delivered",
    failed: "Failed",
    returned: "Returned",
  };

  return status ? (map[status] ?? status) : "Pending";
}

export function routeStatusToDatabase(status?: string | null) {
  const map: Record<string, string> = {
    Pending: "pending",
    "In Progress": "in_progress",
    Completed: "completed",
    Cancelled: "cancelled",
    "Not Started": "pending",
    Paused: "pending",
  };

  return status ? (map[status] ?? status.toLowerCase().replace(/\s+/g, "_")) : "pending";
}

export function routeStatusFromDatabase(status?: string | null) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return status ? (map[status] ?? status) : "Pending";
}

export function routePriorityToDatabase(priority?: string | null) {
  if (!priority) {
    return "medium";
  }

  if (priority === "High Priority") {
    return "high";
  }

  if (priority === "Standard") {
    return "medium";
  }

  return priority.toLowerCase();
}

export function routePriorityFromDatabase(priority?: string | null) {
  if (!priority) {
    return "Standard";
  }

  return priority === "high" ? "High Priority" : priority === "low" ? "Low" : "Standard";
}

export function deliveryPriorityToDatabase(priority?: string | null) {
  if (!priority) {
    return "medium";
  }

  return priority === "Standard" ? "medium" : priority.toLowerCase();
}

export function deliveryPriorityFromDatabase(priority?: string | null) {
  if (!priority) {
    return "Standard";
  }

  return priority === "medium" ? "Standard" : priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function inventoryStatusToDatabase(status?: string | null) {
  const map: Record<string, string> = {
    "In Stock": "in_stock",
    "Low Stock": "low_stock",
    Critical: "out_of_stock",
    "Out of Stock": "out_of_stock",
  };

  return status ? (map[status] ?? status.toLowerCase().replace(/\s+/g, "_")) : "in_stock";
}

export function inventoryStatusFromDatabase(status?: string | null) {
  const map: Record<string, string> = {
    in_stock: "In Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  };

  return status ? (map[status] ?? status) : "In Stock";
}