import { DataTypes, Model, Sequelize } from "sequelize";

export class Shipment extends Model {
  declare id: number;
}

export function initShipmentModel(sequelize: Sequelize) {
  if (sequelize.models.Shipment) {
    return sequelize.models.Shipment as typeof Shipment;
  }

  Shipment.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    shipmentId: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    carrierName: { type: DataTypes.STRING(100), allowNull: false },
    trackingNumber: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    status: { type: DataTypes.ENUM("pending", "picked", "packed", "dispatched", "in_transit", "delivered", "failed"), allowNull: false, defaultValue: "pending" },
    shippingCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    dimensions: { type: DataTypes.STRING(100), allowNull: true },
    dispatchedAt: { type: DataTypes.DATE, allowNull: true },
    estimatedDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
    actualDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
    shippingLabel: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    sequelize,
    modelName: "Shipment",
    tableName: "shipments",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [{ unique: true, fields: ["shipmentId"] }, { fields: ["orderId"] }, { unique: true, fields: ["trackingNumber"] }, { fields: ["status"] }],
  });

  return Shipment;
}