import { Op } from "sequelize";

import { sequelize } from "../config/database";
import { Inventory } from "../models/Inventory";
import { InventoryItemModel } from "../models/InventoryItem";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { OrderModel } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { ApiError } from "../utils/apiError";
import { buildPaginationMeta, resolvePagination } from "../utils/pagination";

function asId(document: any) {
  return String(document._id);
}

function mapOrder(order: any) {
  return {
    id: asId(order),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    orderDate: order.orderDate,
    totalAmount: order.totalAmount,
    status: order.status,
    region: order.region,
    store: order.store,
    priority: order.priority,
    assignedTo: order.assignedTo,
    lastUpdated: order.lastUpdated,
    overdue: order.overdue,
    blockedReason: order.blockedReason,
    highValue: order.highValue,
    deliveryAddress: order.deliveryAddress,
    preferredDeliveryWindow: order.preferredDeliveryWindow,
    deliveryInstructions: order.deliveryInstructions,
    deliveryZone: order.deliveryZone,
    assignedCarrier: order.assignedCarrier,
    trackingNumber: order.trackingNumber,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    transactionId: order.transactionId,
    items: order.items.map((item: any) => ({ id: String(item._id), ...item })),
    subtotal: order.subtotal,
    tax: order.tax,
    shippingCost: order.shippingCost,
    discount: order.discount,
    promoCode: order.promoCode,
    timeline: order.timeline,
    relatedOrderIds: order.relatedOrderIds,
    notes: order.notes,
    cancellationReason: order.cancellationReason,
    customerSatisfaction: order.customerSatisfaction,
    communicationLog: order.communicationLog,
  };
}

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function normalizeOrderRow(order: any) {
  const payload = order.payloadJson ?? {};
  return {
    ...payload,
    _id: order.id,
    id: order.id,
    customerName: payload.customerName ?? order.customerName,
    customerEmail: payload.customerEmail ?? order.customerEmail,
    customerPhone: payload.customerPhone ?? order.customerPhone,
    orderDate: payload.orderDate ?? order.createdAt?.toISOString(),
    totalAmount: Number(payload.totalAmount ?? order.totalAmount),
    status: payload.status ?? (typeof order.status === "string" ? order.status.replace(/_/g, " ").replace(/\b\w/g, (match: string) => match.toUpperCase()) : "Pending"),
    region: payload.region ?? order.region,
    store: payload.store ?? order.store,
    priority: payload.priority ?? (order.priority ? order.priority.charAt(0).toUpperCase() + order.priority.slice(1) : "Medium"),
    assignedTo: payload.assignedTo ?? order.assignedToName,
    lastUpdated: payload.lastUpdated ?? order.lastUpdatedLabel ?? order.updatedAt?.toISOString(),
    overdue: payload.overdue ?? Boolean(order.overdue),
    blockedReason: payload.blockedReason ?? order.blockedReason,
    highValue: payload.highValue ?? Boolean(order.highValue),
    deliveryAddress: payload.deliveryAddress ?? order.deliveryAddress,
    preferredDeliveryWindow: payload.preferredDeliveryWindow ?? order.preferredDeliveryWindow,
    deliveryInstructions: payload.deliveryInstructions ?? order.deliveryInstructions,
    deliveryZone: payload.deliveryZone ?? order.deliveryZone,
    assignedCarrier: payload.assignedCarrier ?? order.assignedCarrierName,
    trackingNumber: payload.trackingNumber ?? order.trackingNumber,
    paymentMethod: payload.paymentMethod ?? order.paymentMethod,
    paymentStatus: payload.paymentStatus ?? order.paymentStatus,
    transactionId: payload.transactionId ?? order.orderId,
    items: payload.items ?? [],
    subtotal: Number(payload.subtotal ?? order.subtotal),
    tax: Number(payload.tax ?? order.tax),
    shippingCost: Number(payload.shippingCost ?? order.shippingCost),
    discount: Number(payload.discount ?? order.discountAmount),
    promoCode: payload.promoCode ?? order.promoCode,
    timeline: payload.timeline ?? order.timelineJson ?? [],
    relatedOrderIds: payload.relatedOrderIds ?? order.relatedOrderIdsJson ?? [],
    notes: payload.notes ?? order.notesJson ?? [],
    cancellationReason: payload.cancellationReason ?? order.cancellationReason,
    customerSatisfaction: payload.customerSatisfaction ?? order.customerSatisfaction,
    communicationLog: payload.communicationLog ?? order.communicationLogJson ?? [],
  };
}

export const managerService = {
  async getDashboard() {
    const [orders, inventory]: [any[], any[]] = await Promise.all([OrderModel.find().lean(), InventoryItemModel.find().lean()]);

    return {
      metrics: [
        { id: "orders", label: "Active orders", value: String(orders.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled").length), description: "Orders requiring orchestration", trendLabel: "+8% this week", trendTone: "positive", icon: "package" },
        { id: "stock-risk", label: "Stock risk SKUs", value: String(inventory.filter((item) => item.status !== "In Stock").length), description: "Items below healthy threshold", trendLabel: "2 critical", trendTone: "warning", icon: "triangle-alert" },
        { id: "dispatch-ready", label: "Dispatch ready", value: String(orders.filter((order) => order.status === "Ready to Dispatch").length), description: "Orders ready for carrier assignment", badgeLabel: "Ops focus", badgeTone: "blue", icon: "truck" },
      ],
      operations: [
        { id: "review-orders", title: "Review priority orders", description: "Inspect blocked and overdue orders before cut-off.", href: "/manager/orders", actionLabel: "Open queue", icon: "clipboard-list" },
        { id: "run-analytics", title: "Run analytics", description: "Inspect sales, inventory, and fulfillment trends.", href: "/manager/analytics", actionLabel: "View analytics", icon: "bar-chart-3" },
        { id: "export-report", title: "Export report pack", description: "Generate stakeholder-ready operational summaries.", href: "/manager/reports", actionLabel: "Export report", icon: "file-output" },
      ],
      priorityQueue: orders.filter((order) => order.priority === "High" || order.overdue || order.status === "On Hold").slice(0, 5).map((order) => ({
        id: asId(order),
        title: `${order.customerName} order`,
        type: order.status,
        priority: order.priority,
        actionLabel: "Review order",
        owner: order.assignedTo,
        dueLabel: order.preferredDeliveryWindow,
        resolved: order.status === "Delivered",
        href: `/manager/orders/${asId(order)}`,
      })),
      notifications: [
        { id: "n1", title: "Blocked order detected", detail: "Lanka Super is still on hold awaiting carrier capacity.", severity: "critical", read: false, timestamp: new Date().toISOString(), category: "orders" },
        { id: "n2", title: "Critical stock risk", detail: "Pure Life Water is out of stock and affects replenishment planning.", severity: "warning", read: false, timestamp: new Date().toISOString(), category: "inventory" },
      ],
      session: {
        timeoutWarning: "15 minutes",
        refreshActive: true,
        rateLimiting: true,
        sameOriginValidation: true,
      },
      dashboardViews: [
        { id: "Quick view", description: "Condensed metrics for active coordination." },
        { id: "Detailed view", description: "Full operational context with queue detail." },
        { id: "Custom", description: "Reserved for user-specific layout preferences." },
      ],
    };
  },

  async getOrdersData(query: Record<string, unknown> = {}) {
    const { page, limit, offset } = resolvePagination(query);
    const where: Record<string | symbol, unknown> = {};

    if (typeof query.status === "string") {
      where.status = query.status.toLowerCase().replace(/\s+/g, "_");
    }

    if (typeof query.priority === "string") {
      where.priority = query.priority.toLowerCase();
    }

    if (typeof query.search === "string" && query.search.trim()) {
      where[Op.or] = [
        { customerName: { [Op.like]: `%${query.search.trim()}%` } },
        { customerEmail: { [Op.like]: `%${query.search.trim()}%` } },
        { store: { [Op.like]: `%${query.search.trim()}%` } },
        { orderId: { [Op.like]: `%${query.search.trim()}%` } },
      ];
    }

    const [pageResult, summaryRows] = await Promise.all([
      Order.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      }),
      Order.findAll({
        where,
        attributes: ["id", "status", "overdue", "blockedReason", "payloadJson", "totalAmount", "createdAt"],
      }),
    ]);

    const mappedOrders = pageResult.rows.map((order) => mapOrder(normalizeOrderRow(order)));
    const allMatchingOrders = summaryRows.map((order) => normalizeOrderRow(order));
    const total = pageResult.count;

    const breakdownLabels = ["Pending", "Processing", "Ready to Dispatch", "Dispatched", "Delivered", "Cancelled", "On Hold"] as const;

    return {
      summary: {
        totalOrders: total,
        pendingOrders: allMatchingOrders.filter((order) => order.status === "Pending").length,
        processingOrders: allMatchingOrders.filter((order) => order.status === "Processing").length,
        readyToDispatch: allMatchingOrders.filter((order) => order.status === "Ready to Dispatch").length,
        overdueOrders: allMatchingOrders.filter((order) => order.overdue).length,
        blockedOrders: allMatchingOrders.filter((order) => Boolean(order.blockedReason)).length,
      },
      orders: mappedOrders,
      pagination: buildPaginationMeta(total, page, limit),
      statusBreakdown: breakdownLabels.map((label) => {
        const value = allMatchingOrders.filter((order) => order.status === label).length;
        return { label, value, percentage: percentage(value, total) };
      }),
      overdue: allMatchingOrders.filter((order) => order.overdue).slice(0, limit),
      blocked: allMatchingOrders.filter((order) => Boolean(order.blockedReason)).slice(0, limit),
      cancelled: allMatchingOrders.filter((order) => order.status === "Cancelled").slice(0, limit),
    };
  },

  async createOrder(payload: Record<string, unknown>) {
    const items = Array.isArray(payload.items) ? payload.items as Array<Record<string, unknown>> : [];
    const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0), 0);
    const tax = Number(payload.tax ?? 0);
    const shippingCost = Number(payload.shippingCost ?? 0);
    const discount = Number(payload.discount ?? 0);
    const totalAmount = subtotal + tax + shippingCost - discount;
    const nowIso = new Date().toISOString();

    const orderId = await sequelize.transaction(async (transaction) => {
      const customerEmail = String(payload.customerEmail).toLowerCase();
      const [customer] = await User.findOrCreate({
        where: { email: customerEmail },
        defaults: {
          email: customerEmail,
          password: "seeded-placeholder",
          fullName: payload.customerName,
          role: "retailer",
          company: payload.store,
          phone: payload.customerPhone ?? null,
          city: payload.deliveryCity ?? payload.region ?? null,
          status: "active",
        },
        transaction,
      });

      const productRows = await Promise.all(
        items.map(async (item) => {
          const product: any = await Product.findOne({ where: { sku: item.sku }, transaction });
          if (!product) {
            throw new ApiError(400, `Unknown product SKU: ${String(item.sku)}`, "PRODUCT_NOT_FOUND");
          }

          const inventory: any = await Inventory.findOne({ where: { productId: product.id }, transaction });
          return { item, product, inventory };
        }),
      );

      const constrainedItems = productRows.filter(({ inventory, item }) => !inventory || inventory.currentStock < Number(item.quantity ?? 0));
      const blockedReason = constrainedItems.length > 0
        ? `Insufficient stock for ${constrainedItems.map(({ item }) => String(item.sku)).join(", ")}`
        : null;

      const generatedOrderId = `ORD-${Date.now()}`;
      const orderPayload = {
        ...payload,
        orderId: generatedOrderId,
        orderDate: nowIso,
        subtotal,
        tax,
        shippingCost,
        discount,
        totalAmount,
        highValue: totalAmount >= 50000,
        blockedReason,
        status: blockedReason ? "Processing" : "Pending",
        paymentStatus: payload.paymentStatus ?? "Pending",
        timeline: [
          { label: "Order created", timestamp: nowIso, actor: "manager" },
        ],
        notes: blockedReason ? [blockedReason] : [],
      };

      const order = await Order.create({
        orderId: generatedOrderId,
        customerId: customer.id,
        customerName: payload.customerName,
        customerEmail,
        customerPhone: payload.customerPhone ?? null,
        region: payload.region ?? null,
        store: payload.store ?? null,
        priority: String(payload.priority ?? "Medium").toLowerCase(),
        assignedToName: payload.assignedTo ?? null,
        lastUpdatedLabel: nowIso,
        overdue: false,
        blockedReason,
        highValue: totalAmount >= 50000,
        preferredDeliveryWindow: payload.preferredDeliveryWindow ?? null,
        deliveryZone: payload.deliveryZone ?? null,
        assignedCarrierName: payload.assignedCarrier ?? null,
        trackingNumber: payload.trackingNumber ?? null,
        promoCode: payload.promoCode ?? null,
        timelineJson: orderPayload.timeline,
        notesJson: orderPayload.notes,
        communicationLogJson: [],
        relatedOrderIdsJson: [],
        payloadJson: orderPayload,
        totalItems: items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
        subtotal,
        tax,
        shippingCost,
        discountAmount: discount,
        totalAmount,
        status: blockedReason ? "processing" : "pending",
        paymentStatus: ["pending", "completed", "failed", "refunded"].includes(String(payload.paymentStatus ?? "").toLowerCase()) ? String(payload.paymentStatus).toLowerCase() : "pending",
        paymentMethod: String(payload.paymentMethod ?? "").toLowerCase().replace(/\s+/g, "_") || null,
        deliveryAddress: payload.deliveryAddress ?? "Unknown address",
        deliveryCity: payload.deliveryCity ?? payload.region ?? "Unknown city",
        deliveryZipCode: payload.deliveryZipCode ?? null,
        deliveryPhone: payload.customerPhone ?? null,
        preferredDeliveryDate: payload.preferredDeliveryDate ?? null,
        deliveryInstructions: payload.deliveryInstructions ?? null,
      }, { transaction });

      await OrderItem.bulkCreate(productRows.map(({ item, product }) => ({
        orderId: order.id,
        productId: product.id,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? product.price),
        subtotal: Number(item.quantity ?? 0) * Number(item.unitPrice ?? product.price),
        specialInstructions: item.notes ?? null,
      })), { transaction });

      return String(order.id);
    });

    return this.getOrder(orderId);
  },

  async getOrder(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }
    return mapOrder(order);
  },

  async updateOrder(id: string, payload: Record<string, unknown>) {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (payload.status) {
      order.status = String(payload.status) as any;
    }
    if (payload.assignedTo) {
      order.assignedTo = String(payload.assignedTo);
    }
    if (payload.priority) {
      order.priority = String(payload.priority) as any;
    }
    if (payload.notes && Array.isArray(payload.notes)) {
      order.notes = [...order.notes, ...payload.notes.map(String)];
    }
    order.lastUpdated = new Date().toISOString();
    await order.save();
    return mapOrder(order);
  },

  async escalateOrder(id: string) {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }
    order.priority = "High";
    order.overdue = true;
    order.notes.push(`Escalated at ${new Date().toISOString()}`);
    order.lastUpdated = new Date().toISOString();
    await order.save();
    return mapOrder(order);
  },

  async getReports() {
    return {
      templates: ["Executive Ops Snapshot", "Daily Fulfillment Summary", "Inventory Exposure Report"],
      scheduled: ["08:00 Daily Warehouse Summary", "18:00 Delivery Completion Rollup"],
      stakeholders: ["Country Ops Lead", "Warehouse Manager", "Retail Partner Team"],
    };
  },

  async exportReport(format: "pdf" | "excel" | "csv") {
    return {
      exportId: `EXP-${Date.now()}`,
      format,
      generatedAt: new Date().toISOString(),
      ready: true,
    };
  },

  async getSalesAnalytics() {
    const orders: any[] = await OrderModel.find().lean();
    return {
      summary: [
        { id: "revenue", label: "Revenue", value: `LKR ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}`, trend: "+12%", tone: "positive" },
        { id: "orders", label: "Orders", value: String(orders.length), trend: "+5%", tone: "positive" },
      ],
      trend: orders.map((order, index) => ({ period: `W${index + 1}`, sales: order.totalAmount, orders: order.items.length, conversionRate: 48 + index * 3, target: order.totalAmount * 1.08 })),
      regionalSales: [{ label: "Western", value: 58, percentage: 58 }, { label: "Central", value: 24, percentage: 24 }, { label: "North Western", value: 18, percentage: 18 }],
      categorySales: [{ label: "Beverages", value: 46 }, { label: "Snacks", value: 32 }, { label: "Dairy", value: 22 }],
      growthComparison: [{ label: "This Month", value: 18 }, { label: "Last Month", value: 11 }],
      targetAchievement: [{ label: "Revenue", actual: 82, target: 100 }, { label: "Orders", actual: 91, target: 100 }],
    };
  },

  async getInventoryAnalytics() {
    const items: any[] = await InventoryItemModel.find().lean();
    return {
      summary: [
        { id: "coverage", label: "Coverage", value: "14 days", trend: "Stable", tone: "neutral" },
        { id: "critical", label: "Critical SKUs", value: String(items.filter((item) => item.status === "Critical" || item.status === "Out of Stock").length), trend: "Needs action", tone: "warning" },
      ],
      stockStatus: ["In Stock", "Low Stock", "Critical", "Out of Stock"].map((label) => ({ label, value: items.filter((item) => item.status === label).length })),
      categoryValues: Array.from(new Set(items.map((item: any) => item.category))).map((category) => ({ label: category, value: items.filter((item: any) => item.category === category).reduce((sum: number, item: any) => sum + item.currentStock * item.unitPrice, 0) })),
      agingTrend: [{ period: "Week 1", days: 11 }, { period: "Week 2", days: 13 }, { period: "Week 3", days: 14 }],
      coverageByCategory: Array.from(new Set(items.map((item: any) => item.category))).map((category) => ({ label: category, value: Math.round(items.filter((item: any) => item.category === category).reduce((sum: number, item: any) => sum + item.daysToStockOut, 0) / Math.max(items.filter((item: any) => item.category === category).length, 1)) })),
      coverageForecast: [{ period: "Current", coverage: 14, target: 21 }, { period: "Next Week", coverage: 12, target: 21 }],
      coverage: { current: "14 days", target: "21 days", trend: "-2 days" },
      turnoverHighlights: {
        turnoverRate: "5.2x",
        fastMoving: ["Nestle Gold Coffee", "KitKat Multipack"],
        slowMoving: ["Pure Life Water"],
        deadStock: [],
        recommendations: ["Increase water replenishment lead visibility", "Reallocate slow-moving snacks to retailer channel"],
      },
    };
  },

  async getOrderAnalytics() {
    const orders: any[] = await OrderModel.find().lean();
    return {
      summary: [
        { id: "fulfillment", label: "Fulfillment SLA", value: "93%", trend: "+2%", tone: "positive" },
        { id: "blocked", label: "Blocked orders", value: String(orders.filter((order) => Boolean(order.blockedReason)).length), trend: "Requires review", tone: "warning" },
      ],
      orderTrend: orders.map((order, index) => ({ period: `D${index + 1}`, sales: order.totalAmount, orders: 1, conversionRate: 44 + index * 4, target: 1 })),
      statusBreakdown: ["Pending", "Processing", "Ready to Dispatch", "Dispatched", "Delivered", "Cancelled", "On Hold"].map((label) => ({ label, value: orders.filter((order) => order.status === label).length })),
      performance: [{ label: "On time", value: 93 }, { label: "Late", value: 7 }],
      customerMetrics: [{ label: "Repeat customers", value: 64 }, { label: "High value", value: orders.filter((order) => order.highValue).length }],
      actionItems: ["Clear held order in Kurunegala", "Review low-stock blocker for Kandy route"],
    };
  },

  async getComparativeAnalytics() {
    return {
      regionComparison: [
        { region: "Western", sales: 88, stock: 76, fulfillment: 94, target: 90 },
        { region: "Central", sales: 64, stock: 58, fulfillment: 89, target: 75 },
        { region: "North Western", sales: 42, stock: 51, fulfillment: 73, target: 60 },
      ],
      productPerformance: [
        { product: "Nestle Gold Coffee", revenue: 72, units: 54, margin: 32, trend: "+8%", status: "Top" },
        { product: "KitKat Multipack", revenue: 48, units: 61, margin: 28, trend: "+5%", status: "Trending" },
        { product: "Pure Life Water", revenue: 20, units: 15, margin: 9, trend: "-11%", status: "Underperforming" },
      ],
      timeComparison: [{ label: "This month", value: 82 }, { label: "Last month", value: 74 }],
    };
  },

  async getAlerts() {
    return [
      { id: "a1", title: "Water stockout risk", detail: "Pure Life Water is out of stock at the primary warehouse.", severity: "critical", recommendation: "Expedite supplier replenishment", actionLabel: "Open inventory" },
      { id: "a2", title: "Held order aging", detail: "Lanka Super order has stayed on hold for more than 12 hours.", severity: "warning", recommendation: "Assign alternate carrier", actionLabel: "Review order" },
    ];
  },
};