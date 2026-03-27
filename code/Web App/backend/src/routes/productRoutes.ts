import { Router } from "express";

import { productController } from "../controllers/productController";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { productCreateSchema, productUpdateSchema } from "../validations/productValidation";

const router = Router();

router.use(requireAuth);

router.get("/", productController.list);
router.get("/category/:category", productController.byCategory);
router.get("/:id", productController.get);
router.post("/", requireRoles("admin"), validateBody(productCreateSchema), productController.create);
router.put("/:id", requireRoles("admin"), validateBody(productUpdateSchema), productController.update);
router.delete("/:id", requireRoles("admin"), productController.remove);

export { router as productRoutes };