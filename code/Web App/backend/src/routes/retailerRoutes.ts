import { Router } from "express";

import { retailerController } from "../controllers/retailerController";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  checkoutSchema,
  exportSalesSchema,
  retailerAdjustSchema,
  retailerInventoryUpdateSchema,
  retailerReceiveSchema,
  salesQuerySchema,
} from "../validations/retailerValidation";

const router = Router();

router.use(requireAuth, requireRoles("admin", "manager", "retailer"));

router.get("/dashboard", retailerController.dashboard);
router.get("/reports", retailerController.reports);

router.get("/inventory", retailerController.inventory);
router.get("/inventory/low-stock", retailerController.lowStock);
router.put("/inventory/:id", validateBody(retailerInventoryUpdateSchema), retailerController.updateInventory);
router.post("/inventory/adjust", validateBody(retailerAdjustSchema), retailerController.adjustInventory);
router.post("/inventory/receive", validateBody(retailerReceiveSchema), retailerController.receiveInventory);

router.get("/pos/products", retailerController.products);
router.post("/pos/checkout", validateBody(checkoutSchema), retailerController.checkout);

router.get("/sales", validateQuery(salesQuerySchema), retailerController.sales);
router.post("/sales/export", validateBody(exportSalesSchema), retailerController.exportSales);

export { router as retailerRoutes };