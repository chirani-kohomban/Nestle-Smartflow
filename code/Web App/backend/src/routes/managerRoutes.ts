import { Router } from "express";

import { managerController } from "../controllers/managerController";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { createOrderSchema, exportReportSchema, ordersQuerySchema, orderUpdateSchema } from "../validations/managerValidation";

const router = Router();

router.use(requireAuth, requireRoles("admin", "manager"));

router.get("/dashboard", managerController.dashboard);
router.get("/orders", validateQuery(ordersQuerySchema), managerController.getOrders);
router.post("/orders", validateBody(createOrderSchema), managerController.createOrder);
router.get("/orders/:id", managerController.getOrder);
router.put("/orders/:id", validateBody(orderUpdateSchema), managerController.updateOrder);
router.post("/orders/:id/escalate", managerController.escalateOrder);

router.get("/reports", managerController.reports);
router.post("/reports/export", validateBody(exportReportSchema), managerController.exportReport);

router.get("/analytics/sales", managerController.salesAnalytics);
router.get("/analytics/inventory", managerController.inventoryAnalytics);
router.get("/analytics/orders", managerController.orderAnalytics);
router.get("/analytics/comparative", managerController.comparativeAnalytics);
router.get("/analytics/alerts", managerController.alerts);

export { router as managerRoutes };