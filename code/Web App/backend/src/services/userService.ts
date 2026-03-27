import { User } from "../models/User";
import { ApiError } from "../utils/apiError";
import { authService } from "./authService";

function serializeUser(user: any) {
  return {
    id: String(user.id),
    fullName: user.fullName,
    email: user.email,
    role: user.role === "warehouse_staff" ? "warehouse" : user.role,
    phone: user.phone,
    company: user.company,
    address: user.address,
    city: user.city,
    status: user.status,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
  };
}

export const userService = {
  async createUser(payload: { fullName: string; email: string; password: string; role: string; phone?: string; company?: string; address?: string; city?: string }) {
    const existing = await User.findOne({ where: { email: String(payload.email).toLowerCase() } });
    if (existing) {
      throw new ApiError(409, "User already exists", "USER_EXISTS");
    }

    const user = await authService.register({
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      password: payload.password,
      phone: payload.phone ?? "",
      company: payload.company ?? "",
      address: payload.address,
      city: payload.city,
      role: payload.role,
    });

    return user;
  },

  async getUsers(role?: string) {
    const rows = await User.findAll({ where: role ? { role: role === "warehouse" ? "warehouse_staff" : role } : undefined, order: [["createdAt", "DESC"]] });
    return rows.map(serializeUser);
  },

  async getUser(id: string) {
    const user: any = await User.findByPk(id);
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    return serializeUser(user);
  },

  async updateUser(id: string, payload: Record<string, unknown>) {
    const user: any = await User.findByPk(id);
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    if (payload.fullName !== undefined) user.fullName = payload.fullName;
    if (payload.phone !== undefined) user.phone = payload.phone;
    if (payload.company !== undefined) user.company = payload.company;
    if (payload.address !== undefined) user.address = payload.address;
    if (payload.city !== undefined) user.city = payload.city;
    if (payload.role !== undefined) user.role = payload.role === "warehouse" ? "warehouse_staff" : payload.role;
    if (payload.status !== undefined) user.status = payload.status;

    await user.save();
    return serializeUser(user);
  },

  async deleteUser(id: string) {
    const user: any = await User.findByPk(id);
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    user.status = "inactive";
    user.refreshTokens = [];
    await user.save();
    return { id: String(user.id), deleted: true };
  },
};