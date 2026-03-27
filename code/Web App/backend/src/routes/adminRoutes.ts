import { Router } from "express";

import { adminController } from "../controllers/adminController";
import { requireAuth, requireRoles } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRoles("admin"));

router.get("/dashboard", adminController.dashboard);

export { router as adminRoutes };