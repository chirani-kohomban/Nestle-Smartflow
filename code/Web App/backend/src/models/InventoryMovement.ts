import { DataTypes, Model, Sequelize } from "sequelize";

export class InventoryMovement extends Model {
  declare id: number;
}

export function initInventoryMovementModel(sequelize: Sequelize) {
  if (sequelize.models.InventoryMovement) {
    return sequelize.models.InventoryMovement as typeof InventoryMovement;
  }

  InventoryMovement.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseLocation: { type: DataTypes.STRING(100), allowNull: false },
    movementType: { type: DataTypes.ENUM("receive", "dispatch", "adjust", "sale", "damage", "transfer"), allowNull: false },
    quantityBefore: { type: DataTypes.INTEGER, allowNull: false },
    quantityAfter: { type: DataTypes.INTEGER, allowNull: false },
    quantityChanged: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    referenceId: { type: DataTypes.STRING(100), allowNull: true },
    performedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  }, {
    sequelize,
    modelName: "InventoryMovement",
    tableName: "inventory_movements",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["productId"] }, { fields: ["warehouseLocation"] }, { fields: ["movementType"] }, { fields: ["createdAt"] }],
  });

  return InventoryMovement;
}