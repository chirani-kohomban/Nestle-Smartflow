import { DataTypes, Model, Sequelize } from "sequelize";

export class DeliveryEarnings extends Model {
  declare id: number;
}

export function initDeliveryEarningsModel(sequelize: Sequelize) {
  if (sequelize.models.DeliveryEarnings) {
    return sequelize.models.DeliveryEarnings as typeof DeliveryEarnings;
  }

  DeliveryEarnings.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    deliveryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    routeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    baseEarnings: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    distanceBonus: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    onTimeBonus: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    performanceBonus: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    specialHandlingBonus: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    deductions: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalEarnings: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    earnedDate: { type: DataTypes.DATEONLY, allowNull: false },
    payoutDate: { type: DataTypes.DATEONLY, allowNull: true },
    payoutStatus: { type: DataTypes.ENUM("pending", "paid", "failed", "refunded"), allowNull: false, defaultValue: "pending" },
    paymentMethod: { type: DataTypes.STRING(50), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  }, {
    sequelize,
    modelName: "DeliveryEarnings",
    tableName: "delivery_earnings",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["driverId"] }, { fields: ["deliveryId"] }, { fields: ["earnedDate"] }, { fields: ["payoutStatus"] }],
  });

  return DeliveryEarnings;
}