import { Inventory } from "../models/Inventory";
import { Order } from "../models/Order";
import { POSTransaction } from "../models/POSTransaction";

function reportCatalog() {
  return [
    { id: "ops-summary", title: "Operations Summary", description: "Cross-functional daily operating summary.", format: "pdf" },
    { id: "inventory-exposure", title: "Inventory Exposure", description: "Low-stock and reorder risk across active warehouses.", format: "excel" },
    { id: "sales-performance", title: "Sales Performance", description: "Sales trend and payment mix overview.", format: "csv" },
  ];
}

export const reportsService = {
  async getReports() {
    const [ordersCount, inventoryCount, salesCount] = await Promise.all([
      Order.count(),
      Inventory.count(),
      POSTransaction.count(),
    ]);

    return {
      items: reportCatalog(),
      summary: {
        ordersCount,
        inventoryCount,
        salesCount,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  async getReport(id: string) {
    const report = reportCatalog().find((entry) => entry.id === id);
    if (!report) {
      throw new Error("Report not found");
    }

    return {
      ...report,
      generatedAt: new Date().toISOString(),
      sections: ["Summary", "Trends", "Exceptions", "Recommendations"],
    };
  },

  async generateReport(payload: Record<string, unknown>) {
    return {
      requestId: `RPT-${Date.now()}`,
      filters: payload,
      status: "generated",
      generatedAt: new Date().toISOString(),
    };
  },

  async exportReport(payload: { format: string; reportId?: string }) {
    return {
      exportId: `EXP-${Date.now()}`,
      reportId: payload.reportId ?? "custom",
      format: payload.format,
      ready: true,
      generatedAt: new Date().toISOString(),
    };
  },
};