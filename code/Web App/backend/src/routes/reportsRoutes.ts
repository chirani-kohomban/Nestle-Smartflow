import { Router } from "express";

import { reportsController } from "../controllers/reportsController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { exportReportSchema, generateReportSchema } from "../validations/reportsValidation";

const router = Router();

router.use(requireAuth);

router.get("/", reportsController.list);
router.get("/:id", reportsController.get);
router.post("/generate", validateBody(generateReportSchema), reportsController.generate);
router.post("/export", validateBody(exportReportSchema), reportsController.export);

export { router as reportsRoutes };