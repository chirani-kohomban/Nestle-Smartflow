import { DataTypes, Model, Sequelize } from "sequelize";

export class OrderItem extends Model {
  declare id: number;
}

export function initOrderItemModel(sequelize: Sequelize) {
  if (sequelize.models.OrderItem) {
    return sequelize.models.OrderItem as typeof OrderItem;
  }

  OrderItem.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    specialInstructions: { type: DataTypes.TEXT, allowNull: true },
  }, {
    sequelize,
    modelName: "OrderItem",
    tableName: "order_items",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
    indexes: [{ fields: ["orderId"] }, { fields: ["productId"] }],
  });

  return OrderItem;
}