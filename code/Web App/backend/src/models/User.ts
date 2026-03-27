import { DataTypes, Model, Sequelize } from "sequelize";

import { attachDocument, ManyRecordQuery, roleFromDatabase, roleToDatabase, SingleRecordQuery } from "./compat";

export class User extends Model {
  declare id: number;
}

export function initUserModel(sequelize: Sequelize) {
  if (sequelize.models.User) {
    return sequelize.models.User as typeof User;
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      fullName: { type: DataTypes.STRING(255), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      role: { type: DataTypes.ENUM("admin", "manager", "warehouse_staff", "delivery", "retailer"), allowNull: true },
      company: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      state: { type: DataTypes.STRING(100), allowNull: true },
      zipCode: { type: DataTypes.STRING(20), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      status: { type: DataTypes.ENUM("active", "inactive", "suspended"), allowNull: false, defaultValue: "active" },
      avatar: { type: DataTypes.STRING(255), allowNull: true },
      lastLogin: { type: DataTypes.DATE, allowNull: true },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      refreshTokens: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [{ unique: true, fields: ["email"] }, { fields: ["role"] }, { fields: ["status"] }, { fields: ["createdAt"] }],
    },
  );

  return User;
}

function toPlain(instance: any) {
  return {
    _id: instance.id,
    id: instance.id,
    email: instance.email,
    passwordHash: instance.password,
    fullName: instance.fullName,
    phone: instance.phone,
    role: roleFromDatabase(instance.role),
    company: instance.company,
    address: instance.address,
    city: instance.city,
    state: instance.state,
    zipCode: instance.zipCode,
    country: instance.country,
    status: instance.status,
    avatar: instance.avatar,
    lastLogin: instance.lastLogin,
    emailVerified: Boolean(instance.emailVerified),
    refreshTokens: Array.isArray(instance.refreshTokens) ? instance.refreshTokens : [],
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
  };
}

function toDocument(instance: any) {
  const document = attachDocument(toPlain(instance), instance.id, async () => {
    instance.email = String(document.email).toLowerCase();
    instance.password = document.passwordHash;
    instance.fullName = document.fullName;
    instance.phone = document.phone ?? null;
    instance.role = roleToDatabase(document.role as string | null) ?? null;
    instance.company = document.company ?? null;
    instance.address = document.address ?? null;
    instance.city = document.city ?? null;
    instance.state = document.state ?? null;
    instance.zipCode = document.zipCode ?? null;
    instance.country = document.country ?? null;
    instance.status = document.status ?? "active";
    instance.avatar = document.avatar ?? null;
    instance.lastLogin = document.lastLogin ?? null;
    instance.emailVerified = Boolean(document.emailVerified);
    instance.refreshTokens = document.refreshTokens ?? [];
    await instance.save();
  });

  return document;
}

async function fetchOne(where: Record<string, unknown>, lean: boolean) {
  const refreshToken = typeof where.refreshTokens === "string" ? where.refreshTokens : undefined;
  const normalizedWhere: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(where)) {
    if (key === "_id") {
      normalizedWhere.id = value;
    } else if (key !== "refreshTokens") {
      normalizedWhere[key] = key === "role" ? roleToDatabase(String(value)) : value;
    }
  }

  const rows = await User.findAll({ where: normalizedWhere, limit: 20 });
  const match = rows.find((row: any) => !refreshToken || (Array.isArray(row.refreshTokens) && row.refreshTokens.includes(refreshToken)));
  if (!match) {
    return null;
  }

  return lean ? toPlain(match) : toDocument(match);
}

export const UserModel: any = {
  countDocuments() {
    return User.count();
  },

  insertMany(items: Record<string, unknown>[]) {
    return Promise.all(items.map((item) => UserModel.create(item)));
  },

  create(item: Record<string, unknown>) {
    return User.create({
      email: String(item.email).toLowerCase(),
      password: item.passwordHash ?? item.password,
      fullName: item.fullName,
      phone: item.phone ?? null,
      role: roleToDatabase(String(item.role ?? "retailer")),
      company: item.company ?? null,
      address: item.address ?? null,
      city: item.city ?? null,
      state: item.state ?? null,
      zipCode: item.zipCode ?? null,
      country: item.country ?? null,
      status: item.status ?? "active",
      avatar: item.avatar ?? null,
      lastLogin: item.lastLogin ?? null,
      emailVerified: Boolean(item.emailVerified),
      refreshTokens: item.refreshTokens ?? [],
    }).then(toDocument);
  },

  findOne(where: Record<string, unknown>) {
    return new SingleRecordQuery((lean) => fetchOne(where, lean));
  },

  findById(id: string | number) {
    return new SingleRecordQuery((lean) => fetchOne({ _id: id }, lean));
  },

  async updateOne(where: Record<string, unknown>, update: Record<string, unknown>) {
    const user: any = await fetchOne(where, false);
    if (!user) {
      return { modifiedCount: 0 };
    }

    if (update.$pull && typeof update.$pull === "object") {
      const refreshToken = (update.$pull as Record<string, unknown>).refreshTokens;
      if (typeof refreshToken === "string") {
        user.refreshTokens = (user.refreshTokens ?? []).filter((token: string) => token !== refreshToken);
        await user.save();
      }
    }

    return { modifiedCount: 1 };
  },

  find(where: Record<string, unknown> = {}) {
    return new ManyRecordQuery(async ({ sort, limit }, lean) => {
      const normalizedWhere: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(where)) {
        normalizedWhere[key === "_id" ? "id" : key] = key === "role" ? roleToDatabase(String(value)) : value;
      }

      const rows = await User.findAll({
        where: normalizedWhere,
        order: sort ? Object.entries(sort).map(([key, direction]) => [key, direction === -1 ? "DESC" : "ASC"]) : undefined,
        limit,
      });

      return rows.map((row) => (lean ? toPlain(row) : toDocument(row)));
    });
  },
};