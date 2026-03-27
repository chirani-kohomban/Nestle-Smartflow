import { Router } from "express";

import { userController } from "../controllers/userController";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { userCreateSchema, userUpdateSchema } from "../validations/userValidation";

const router = Router();

router.use(requireAuth);

router.post("/", requireRoles("admin"), validateBody(userCreateSchema), userController.create);
router.get("/", requireRoles("admin"), userController.list);
router.get("/role/:role", requireRoles("admin"), userController.list);
router.get("/:id", userController.get);
router.put("/:id", validateBody(userUpdateSchema), userController.update);
router.delete("/:id", requireRoles("admin"), userController.remove);

export { router as userRoutes };