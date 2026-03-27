import { Router } from "express";

import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { deliveryRoutes } from "./deliveryRoutes";
import { healthRoutes } from "./healthRoutes";
import { managerRoutes } from "./managerRoutes";
import { productRoutes } from "./productRoutes";
import { reportsRoutes } from "./reportsRoutes";
import { retailerRoutes } from "./retailerRoutes";
import { userRoutes } from "./userRoutes";
import { warehouseRoutes } from "./warehouseRoutes";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/manager", managerRoutes);
router.use("/warehouse", warehouseRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/retailer", retailerRoutes);
router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportsRoutes);

export { router as apiRoutes };