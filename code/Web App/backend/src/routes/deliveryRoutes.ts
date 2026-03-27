import { Router } from "express";

import { deliveryController } from "../controllers/deliveryController";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { deliveriesQuerySchema, issueSchema, locationSchema, proofSchema, signatureSchema } from "../validations/deliveryValidation";

const router = Router();

router.use(requireAuth, requireRoles("admin", "manager", "delivery"));

router.get("/dashboard", deliveryController.dashboard);
router.get("/deliveries", validateQuery(deliveriesQuerySchema), deliveryController.getDeliveries);
router.get("/deliveries/:id", deliveryController.getDelivery);
router.post("/deliveries/:id/complete", deliveryController.completeDelivery);
router.post("/deliveries/:id/proof", validateBody(proofSchema), deliveryController.uploadProof);
router.post("/deliveries/:id/issue", validateBody(issueSchema), deliveryController.reportIssue);

router.get("/routes", deliveryController.getRoutes);
router.get("/routes/:id", deliveryController.getRoute);
router.post("/routes/:id/start", deliveryController.startRoute);
router.post("/routes/:id/end", deliveryController.endRoute);
router.get("/routes/:id/optimize", deliveryController.optimizeRoute);

router.get("/earnings", deliveryController.earnings);
router.get("/earnings/:period", deliveryController.earningsByPeriod);
router.post("/location", validateBody(locationSchema), deliveryController.trackLocation);
router.get("/navigation", deliveryController.navigation);
router.post("/signature", validateBody(signatureSchema), deliveryController.signature);

export { router as deliveryRoutes };