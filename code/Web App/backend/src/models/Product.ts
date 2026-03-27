import { DataTypes, Model, Sequelize } from "sequelize";

export class Product extends Model {
  declare id: number;
}

export function initProductModel(sequelize: Sequelize) {
  if (sequelize.models.Product) {
    return sequelize.models.Product as typeof Product;
  }

  Product.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    costPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    image: { type: DataTypes.STRING(255), allowNull: true },
    weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    dimensions: { type: DataTypes.STRING(100), allowNull: true },
    manufacturer: { type: DataTypes.STRING(255), allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    barcode: { type: DataTypes.STRING(100), allowNull: true },
    loyaltyEligible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [
      { unique: true, fields: ["sku"] },
      { fields: ["category"] },
      { fields: ["name"] },
      { fields: ["isActive"] },
    ],
  });

  return Product;
}