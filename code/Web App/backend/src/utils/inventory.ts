import type { InventoryStatus, RetailInventoryStatus } from "../types/domain";

export function computeInventoryStatus(currentStock: number, reorderLevel: number): InventoryStatus {
  if (currentStock <= 0) {
    return "Out of Stock";
  }
  if (currentStock <= Math.max(1, Math.floor(reorderLevel / 2))) {
    return "Critical";
  }
  if (currentStock <= reorderLevel) {
    return "Low Stock";
  }
  return "In Stock";
}

export function toRetailInventoryStatus(status: InventoryStatus): RetailInventoryStatus {
  return status === "Critical" ? "Low Stock" : status;
}

export function computeDaysToStockOut(currentStock: number) {
  if (currentStock <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(currentStock / 8));
}