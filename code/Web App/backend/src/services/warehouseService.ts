import { InventoryItemModel } from "../models/InventoryItem";
import { OrderModel } from "../models/Order";
import { WarehouseTaskModel } from "../models/WarehouseTask";
import { ApiError } from "../utils/apiError";
import { computeDaysToStockOut, computeInventoryStatus } from "../utils/inventory";

const carriers = [
  { id: "carrier-1", name: "Lanka Express", onTimeRate: "96%", damageRate: "0.8%", averageDeliveryTime: "6h", satisfactionScore: "4.8/5", capacityToday: "12 routes", vehicleType: "Truck", serviceAreas: ["Colombo", "Negombo", "Gampaha"], shippingCost: 4200 },
  { id: "carrier-2", name: "Swift Haul", onTimeRate: "91%", damageRate: "1.2%", averageDeliveryTime: "8h", satisfactionScore: "4.5/5", capacityToday: "8 routes", vehicleType: "Van", serviceAreas: ["Kandy", "Kurunegala", "Matale"], shippingCost: 3600 },
  { id: "carrier-3", name: "Island Logistics", onTimeRate: "94%", damageRate: "1.0%", averageDeliveryTime: "7h", satisfactionScore: "4.6/5", capacityToday: "15 routes", vehicleType: "Hybrid Fleet", serviceAreas: ["Nationwide"], shippingCost: 5100 },
];

function asId(document: any) {
  return String(document._id);
}

function mapInventoryItem(item: any) {
  return {
    id: asId(item),
    sku: item.sku,
    productName: item.productName,
    category: item.category,
    currentStock: item.currentStock,
    reorderLevel: item.reorderLevel,
    zone: item.zone,
    location: item.location,
    lastUpdated: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
    status: item.status,
    daysToStockOut: item.daysToStockOut,
    unitPrice: item.unitPrice,
    expiryDate: item.expiryDate,
  };
}

function mapWarehouseTask(task: any) {
  return {
    id: asId(task),
    type: task.type,
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignee: task.assignee,
    createdDate: task.createdDate,
    dueTime: task.dueTime,
    status: task.status,
    progress: task.progress,
    zone: task.zone,
    orderId: task.orderId,
    customerName: task.customerName,
    instructions: task.instructions,
  };
}

function mapDispatchOrder(order: any) {
  return {
    id: asId(order),
    customerName: order.customerName,
    deliveryAddress: order.deliveryAddress,
    itemsCount: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    weight: `${order.items.reduce((sum: number, item: any) => sum + item.quantity * 2.5, 0).toFixed(0)} kg`,
    dimensions: "120x80x110 cm",
    deliveryZone: order.deliveryZone,
    priority: order.priority,
    trackingStatus: order.status === "Ready to Dispatch" ? "Ready to Dispatch" : order.status === "Dispatched" ? "Dispatched" : order.status === "Delivered" ? "Delivered" : order.status === "On Hold" ? "On Hold" : "In Transit",
    assignedCarrier: order.assignedCarrier,
    scheduledDelivery: order.preferredDeliveryWindow,
    orderDate: order.orderDate,
    trackingNumber: order.trackingNumber,
    specialHandling: order.deliveryInstructions,
  };
}

async function recalculateInventory(itemId: string) {
  const item = await InventoryItemModel.findById(itemId);
  if (!item) {
    throw new ApiError(404, "Inventory item not found", "INVENTORY_NOT_FOUND");
  }

  item.status = computeInventoryStatus(item.currentStock, item.reorderLevel);
  item.daysToStockOut = computeDaysToStockOut(item.currentStock);
  await item.save();
  return item;
}

export const warehouseService = {
  async getDashboard() {
    const [inventoryItems, tasks, orders]: [any[], any[], any[]] = await Promise.all([
      InventoryItemModel.find().lean(),
      WarehouseTaskModel.find().lean(),
      OrderModel.find().lean(),
    ]);

    const lowStockCount = inventoryItems.filter((item) => item.status === "Low Stock" || item.status === "Critical" || item.status === "Out of Stock").length;
    const pendingTasks = tasks.filter((task) => task.status !== "Completed").length;
    const readyOrders = orders.filter((order) => order.status === "Ready to Dispatch").length;

    return {
      metrics: [
        { id: "inventory", label: "Inventory health", value: `${inventoryItems.length} SKUs`, description: `${lowStockCount} items need attention`, icon: "boxes" },
        { id: "tasks", label: "Open warehouse tasks", value: String(pendingTasks), description: `${tasks.filter((task) => task.priority === "High").length} high priority`, icon: "clipboard" },
        { id: "dispatch", label: "Ready to dispatch", value: String(readyOrders), description: "Orders cleared for manifesting", icon: "truck" },
      ],
      operations: [
        { id: "receive-stock", title: "Receive inbound stock", description: "Register incoming supplier deliveries and dock inspections.", actionLabel: "Open receiving" },
        { id: "adjust-stock", title: "Adjust inventory", description: "Apply approved corrections for damaged or reconciled stock.", actionLabel: "Adjust stock" },
        { id: "dispatch", title: "Dispatch orders", description: "Assign carriers and generate shipping labels.", actionLabel: "Review dispatch" },
      ],
      batches: orders.slice(0, 3).map((order, index) => ({ id: asId(order), title: `Batch ${index + 1} - ${order.customerName}`, status: order.status === "Ready to Dispatch" ? "Ready for picking" : order.status === "Processing" ? "Packing in progress" : "Awaiting stock release", progress: order.status === "Delivered" ? 100 : order.status === "Ready to Dispatch" ? 82 : 46, expectedRelease: order.preferredDeliveryWindow })),
      notifications: lowStockCount + pendingTasks,
    };
  },

  async getReports() {
    const items: any[] = await InventoryItemModel.find().lean();
    const totalValue = items.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0);

    return [
      { id: "inventory-value", label: "Inventory value", value: `LKR ${totalValue.toLocaleString()}`, detail: "Current on-hand valuation" },
      { id: "critical-count", label: "Critical stock", value: String(items.filter((item) => item.status === "Critical" || item.status === "Out of Stock").length), detail: "Immediate replenishment needed" },
      { id: "coverage", label: "Average coverage", value: `${Math.round(items.reduce((sum, item) => sum + item.daysToStockOut, 0) / Math.max(items.length, 1))} days`, detail: "Projected stock coverage window" },
    ];
  },

  async getInventoryData() {
    const items: any[] = await InventoryItemModel.find().lean();
    const mappedItems = items.map(mapInventoryItem);

    const zones = Object.values(items.reduce((accumulator: Record<string, any>, item: any) => {
      const entry = accumulator[item.zone] ?? { id: item.zone.toLowerCase().replace(/\s+/g, "-"), name: item.zone, totalItems: 0, occupancyPercent: 0, lastInventoryCheck: item.updatedAt, alertStatus: "Normal" };
      entry.totalItems += item.currentStock;
      entry.occupancyPercent = Math.min(100, Math.round((entry.totalItems / 300) * 100));
      entry.lastInventoryCheck = item.updatedAt;
      if (item.status === "Critical" || item.status === "Out of Stock") {
        entry.alertStatus = "Critical";
      } else if (item.status === "Low Stock" && entry.alertStatus !== "Critical") {
        entry.alertStatus = "Attention";
      }
      accumulator[item.zone] = entry;
      return accumulator;
    }, {})).map((zone: any) => ({ ...zone, lastInventoryCheck: zone.lastInventoryCheck instanceof Date ? zone.lastInventoryCheck.toISOString() : String(zone.lastInventoryCheck) }));

    return {
      items: mappedItems,
      zones,
      alerts: items.filter((item) => item.status !== "In Stock").map((item) => ({
        id: asId(item),
        title: `${item.productName} requires attention`,
        detail: `${item.currentStock} units remaining in ${item.zone}`,
        severity: item.status === "Low Stock" ? "warning" : "critical",
        actionLabel: "Review stock",
      })),
      reports: await this.getReports(),
    };
  },

  async getZones() {
    const inventory = await this.getInventoryData();
    return inventory.zones;
  },

  async updateInventoryItem(id: string, payload: Record<string, unknown>) {
    const item = await InventoryItemModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!item) {
      throw new ApiError(404, "Inventory item not found", "INVENTORY_NOT_FOUND");
    }
    item.status = computeInventoryStatus(item.currentStock, item.reorderLevel);
    item.daysToStockOut = computeDaysToStockOut(item.currentStock);
    await item.save();
    return mapInventoryItem(item);
  },

  async adjustStock(payload: { inventoryId: string; adjustmentType: "Add" | "Remove"; quantity: number }) {
    const item = await InventoryItemModel.findById(payload.inventoryId);
    if (!item) {
      throw new ApiError(404, "Inventory item not found", "INVENTORY_NOT_FOUND");
    }
    item.currentStock = payload.adjustmentType === "Add" ? item.currentStock + payload.quantity : Math.max(0, item.currentStock - payload.quantity);
    await item.save();
    const updated = await recalculateInventory(String(item._id));
    return mapInventoryItem(updated);
  },

  async receiveStock(payload: { items: Array<{ sku: string; receivedQuantity: number; rackLocation: string }> }) {
    for (const inbound of payload.items) {
      const item = await InventoryItemModel.findOne({ sku: inbound.sku });
      if (item) {
        item.currentStock += inbound.receivedQuantity;
        item.rackLocation = inbound.rackLocation;
        await item.save();
        await recalculateInventory(String(item._id));
      }
    }

    return { processed: payload.items.length, receivedAt: new Date().toISOString() };
  },

  async transferStock(payload: { inventoryId: string; destinationZone: string }) {
    const item = await InventoryItemModel.findById(payload.inventoryId);
    if (!item) {
      throw new ApiError(404, "Inventory item not found", "INVENTORY_NOT_FOUND");
    }

    item.zone = payload.destinationZone;
    await item.save();
    return mapInventoryItem(item);
  },

  async completeCycleCount(payload: { zone: string; items: Array<{ sku: string; scannedQuantity: number }> }) {
    for (const entry of payload.items) {
      const item = await InventoryItemModel.findOne({ sku: entry.sku, zone: payload.zone });
      if (item) {
        item.currentStock = entry.scannedQuantity;
        await item.save();
        await recalculateInventory(String(item._id));
      }
    }

    return { reconciled: payload.items.length, zone: payload.zone, completedAt: new Date().toISOString() };
  },

  async getDispatchData() {
    const orders: any[] = await OrderModel.find().lean();
    const mappedOrders = orders.map(mapDispatchOrder);
    return {
      summary: {
        readyToDispatch: mappedOrders.filter((order) => order.trackingStatus === "Ready to Dispatch").length,
        dispatchedToday: mappedOrders.filter((order) => order.trackingStatus === "Dispatched").length,
        inTransit: mappedOrders.filter((order) => order.trackingStatus === "In Transit").length,
        expectedToday: mappedOrders.filter((order) => order.priority === "High").length,
        efficiency: `${92 + Math.min(6, mappedOrders.length)}%`,
      },
      orders: mappedOrders,
      carriers,
    };
  },

  async dispatchOrder(id: string) {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }
    order.status = "Dispatched";
    order.lastUpdated = new Date().toISOString();
    order.trackingNumber = order.trackingNumber ?? `NSF-TRK-${Date.now()}`;
    order.timeline.push({ label: "Dispatched", timestamp: new Date().toISOString(), status: "active" });
    await order.save();
    return mapDispatchOrder(order);
  },

  async assignCarrier(id: string, carrierId: string) {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    const carrier = carriers.find((entry) => entry.id === carrierId);
    if (!carrier) {
      throw new ApiError(404, "Carrier not found", "CARRIER_NOT_FOUND");
    }

    order.assignedCarrier = carrier.name;
    order.lastUpdated = new Date().toISOString();
    await order.save();
    return mapDispatchOrder(order);
  },

  async getTracking(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    return order.timeline.map((entry: any, index: number) => ({
      id: `${id}-${index}`,
      timestamp: entry.timestamp,
      status: entry.label,
      detail: `${entry.label} (${entry.status})`,
    }));
  },

  async generateLabel(payload: { orderId: string; carrierId: string }) {
    const order = await OrderModel.findById(payload.orderId).lean();
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    return {
      labelId: `LBL-${Date.now()}`,
      orderId: payload.orderId,
      carrierId: payload.carrierId,
      printable: true,
    };
  },

  async getTasksData() {
    const tasks: any[] = await WarehouseTaskModel.find().lean();
    const mappedTasks = tasks.map(mapWarehouseTask);
    return {
      tasks: mappedTasks,
      statistics: {
        totalToday: mappedTasks.length,
        completedToday: mappedTasks.filter((task) => task.status === "Completed").length,
        pendingTasks: mappedTasks.filter((task) => task.status === "Pending").length,
        overdueTasks: mappedTasks.filter((task) => new Date(task.dueTime).getTime() < Date.now() && task.status !== "Completed").length,
        averageCompletionTime: "2h 14m",
      },
    };
  },

  async startTask(id: string) {
    const task = await WarehouseTaskModel.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    }
    task.status = "In Progress";
    task.progress = Math.max(task.progress, 10);
    await task.save();
    return mapWarehouseTask(task);
  },

  async completeTask(id: string) {
    const task = await WarehouseTaskModel.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    }
    task.status = "Completed";
    task.progress = 100;
    await task.save();
    return mapWarehouseTask(task);
  },

  async updateTask(id: string, payload: Record<string, unknown>) {
    const task = await WarehouseTaskModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!task) {
      throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    }
    return mapWarehouseTask(task);
  },
};