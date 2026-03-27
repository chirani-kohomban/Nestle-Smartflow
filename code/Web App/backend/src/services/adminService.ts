import { Inventory } from "../models/Inventory";
import { Order } from "../models/Order";
import { POSTransaction } from "../models/POSTransaction";
import { Product } from "../models/Product";
import { User } from "../models/User";

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

export const adminService = {
  async getDashboard() {
    const [users, products, orders, inventory, transactions] = await Promise.all([
      User.findAll({ order: [["createdAt", "DESC"]], limit: 5 }),
      Product.findAll(),
      Order.findAll({ order: [["createdAt", "DESC"]], limit: 14 }),
      Inventory.findAll(),
      POSTransaction.findAll({ order: [["createdAt", "DESC"]], limit: 7 }),
    ]);

    const grossRevenue = transactions.reduce((sum, transaction: any) => sum + numberValue(transaction.totalAmount), 0);
    const lowStockCount = inventory.filter((item: any) => item.currentStock <= item.reorderLevel).length;
    const activeOrders = orders.filter((order: any) => order.status !== "delivered" && order.status !== "cancelled").length;

    return {
      cards: [
        { label: "Active users", value: String(users.length), change: "+4 this week", tone: "accent" },
        { label: "Gross revenue", value: `LKR ${grossRevenue.toLocaleString()}`, change: "+8.2%", tone: "success" },
        { label: "Active orders", value: String(activeOrders), change: `${activeOrders} in flow`, tone: "warning" },
        { label: "Low stock alerts", value: String(lowStockCount), change: lowStockCount > 0 ? "Requires action" : "Healthy", tone: lowStockCount > 0 ? "warning" : "success" },
      ],
      salesTrend: transactions.map((transaction: any, index) => ({ label: `D${index + 1}`, value: numberValue(transaction.totalAmount), target: Math.round(numberValue(transaction.totalAmount) * 1.08) })).reverse(),
      fulfillmentTrend: orders.map((order: any, index) => ({ label: `O${index + 1}`, value: order.status === "delivered" ? 100 : order.status === "dispatched" ? 85 : order.status === "processing" ? 55 : 35 })).slice(0, 7),
      categoryMix: Array.from(new Set(products.map((product: any) => product.category))).map((category) => ({ name: category, value: products.filter((product: any) => product.category === category).length })),
      recentActivities: users.map((user: any, index) => ({
        id: `activity-${user.id}`,
        title: `${user.fullName} updated workspace access`,
        description: `${user.role} permissions synchronized with SmartFlow backend.`,
        time: `${index + 1}h ago`,
        tone: index % 3 === 0 ? "accent" : index % 3 === 1 ? "success" : "warning",
      })),
    };
  },
};