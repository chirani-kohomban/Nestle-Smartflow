import type { Sequelize } from "sequelize";

import { AuditLog, initAuditLogModel } from "./AuditLog";
import { Delivery, initDeliveryModel, DeliveryModel } from "./Delivery";
import { DeliveryEarnings, initDeliveryEarningsModel } from "./DeliveryEarnings";
import { DeliveryRoute, initDeliveryRouteModel, DeliveryRouteModel } from "./DeliveryRoute";
import { initInventoryItemModels, InventoryItemModel } from "./InventoryItem";
import { Inventory, initInventoryModel } from "./Inventory";
import { InventoryMovement, initInventoryMovementModel } from "./InventoryMovement";
import { ManagerAnalytics, initManagerAnalyticsModel } from "./ManagerAnalytics";
import { Notification, initNotificationModel } from "./Notification";
import { Order, initOrderModel, OrderModel } from "./Order";
import { OrderItem, initOrderItemModel } from "./OrderItem";
import { POSTransaction, initPOSTransactionModel } from "./POSTransaction";
import { POSTransactionItem, initPOSTransactionItemModel } from "./POSTransactionItem";
import { Product, initProductModel } from "./Product";
import { SalesReport, initSalesReportModel } from "./SalesReport";
import { Shipment, initShipmentModel } from "./Shipment";
import { TransactionModel } from "./Transaction";
import { User, initUserModel, UserModel } from "./User";
import { WarehouseTask, initWarehouseTaskModel, WarehouseTaskModel } from "./WarehouseTask";

export function initializeModels(sequelize: Sequelize) {
  initUserModel(sequelize);
  initProductModel(sequelize);
  initInventoryModel(sequelize);
  initInventoryItemModels(sequelize);
  initOrderModel(sequelize);
  initOrderItemModel(sequelize);
  initShipmentModel(sequelize);
  initWarehouseTaskModel(sequelize);
  initDeliveryRouteModel(sequelize);
  initDeliveryModel(sequelize);
  initDeliveryEarningsModel(sequelize);
  initPOSTransactionModel(sequelize);
  initPOSTransactionItemModel(sequelize);
  initSalesReportModel(sequelize);
  initInventoryMovementModel(sequelize);
  initManagerAnalyticsModel(sequelize);
  initAuditLogModel(sequelize);
  initNotificationModel(sequelize);

  Product.hasMany(Inventory, { foreignKey: "productId", as: "inventoryRecords" });
  Inventory.belongsTo(Product, { foreignKey: "productId", as: "product" });

  User.hasMany(Order, { foreignKey: "customerId", as: "orders" });
  Order.belongsTo(User, { foreignKey: "customerId", as: "customer" });

  Order.hasMany(OrderItem, { foreignKey: "orderId", as: "itemsList" });
  OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });
  Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
  OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

  Order.hasMany(Shipment, { foreignKey: "orderId", as: "shipments" });
  Shipment.belongsTo(Order, { foreignKey: "orderId", as: "order" });

  Shipment.hasMany(Delivery, { foreignKey: "shipmentId", as: "deliveries" });
  Delivery.belongsTo(Shipment, { foreignKey: "shipmentId", as: "shipment" });

  DeliveryRoute.hasMany(Delivery, { foreignKey: "routeId", as: "deliveries" });
  Delivery.belongsTo(DeliveryRoute, { foreignKey: "routeId", as: "route" });

  User.hasMany(POSTransaction, { foreignKey: "cashierId", as: "posTransactions" });
  POSTransaction.belongsTo(User, { foreignKey: "cashierId", as: "cashier" });

  POSTransaction.hasMany(POSTransactionItem, { foreignKey: "transactionId", sourceKey: "id", as: "itemsList" });
  POSTransactionItem.belongsTo(POSTransaction, { foreignKey: "transactionId", targetKey: "id", as: "transaction" });
  Product.hasMany(POSTransactionItem, { foreignKey: "productId", as: "transactionItems" });
  POSTransactionItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

  User.hasMany(WarehouseTask, { foreignKey: "assignedTo", as: "warehouseTasks" });
  WarehouseTask.belongsTo(User, { foreignKey: "assignedTo", as: "assigneeUser" });

  User.hasMany(DeliveryEarnings, { foreignKey: "driverId", as: "earnings" });
  DeliveryEarnings.belongsTo(User, { foreignKey: "driverId", as: "deliveryPartner" });
  Delivery.hasOne(DeliveryEarnings, { foreignKey: "deliveryId", as: "earningsRecord" });
  DeliveryEarnings.belongsTo(Delivery, { foreignKey: "deliveryId", as: "delivery" });

  Product.hasMany(InventoryMovement, { foreignKey: "productId", as: "movements" });
  InventoryMovement.belongsTo(Product, { foreignKey: "productId", as: "product" });
  User.hasMany(InventoryMovement, { foreignKey: "performedBy", as: "inventoryMovements" });
  InventoryMovement.belongsTo(User, { foreignKey: "performedBy", as: "performedByUser" });

  User.hasMany(SalesReport, { foreignKey: "generatedBy", as: "salesReports" });
  SalesReport.belongsTo(User, { foreignKey: "generatedBy", as: "generatedByUser" });
  User.hasMany(ManagerAnalytics, { foreignKey: "managerId", as: "analytics" });
  ManagerAnalytics.belongsTo(User, { foreignKey: "managerId", as: "manager" });
  User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
  AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
}

export { DeliveryModel, DeliveryRouteModel, InventoryItemModel, OrderModel, TransactionModel, UserModel, WarehouseTaskModel };