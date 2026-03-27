import { Router } from "express";

import { authController } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../validations/authValidation";

const router = Router();

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/register", validateBody(registerSchema), authController.register);
router.post("/logout", authController.logout);
router.get("/user", requireAuth, authController.currentUser);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", validateBody(forgotPasswordSchema), authController.forgotPassword);

export { router as authRoutes };