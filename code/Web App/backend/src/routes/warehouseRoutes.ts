import { Router } from "express";

import { warehouseController } from "../controllers/warehouseController";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  assignCarrierSchema,
  cycleCountSchema,
  generateLabelSchema,
  inventoryUpdateSchema,
  receiveStockSchema,
  stockAdjustmentSchema,
  taskUpdateSchema,
  transferStockSchema,
} from "../validations/warehouseValidation";

const router = Router();

router.use(requireAuth, requireRoles("admin", "manager", "warehouse"));

router.get("/dashboard", warehouseController.dashboard);
router.get("/reports", warehouseController.reports);
router.get("/inventory", warehouseController.getInventory);
router.get("/inventory/zones", warehouseController.getZones);
router.put("/inventory/:id", validateBody(inventoryUpdateSchema), warehouseController.updateInventory);
router.post("/inventory/adjust", validateBody(stockAdjustmentSchema), warehouseController.adjustStock);
router.post("/inventory/receive", validateBody(receiveStockSchema), warehouseController.receiveStock);
router.post("/inventory/transfer", validateBody(transferStockSchema), warehouseController.transferStock);
router.post("/inventory/cycle-count", validateBody(cycleCountSchema), warehouseController.cycleCount);

router.get("/dispatch", warehouseController.getDispatch);
router.post("/dispatch/:id/dispatch", warehouseController.dispatchOrder);
router.post("/dispatch/:id/assign-carrier", validateBody(assignCarrierSchema), warehouseController.assignCarrier);
router.get("/dispatch/tracking/:id", warehouseController.getTracking);
router.post("/dispatch/generate-label", validateBody(generateLabelSchema), warehouseController.generateLabel);

router.get("/tasks", warehouseController.getTasks);
router.post("/tasks/:id/start", warehouseController.startTask);
router.post("/tasks/:id/complete", warehouseController.completeTask);
router.put("/tasks/:id", validateBody(taskUpdateSchema), warehouseController.updateTask);

export { router as warehouseRoutes };