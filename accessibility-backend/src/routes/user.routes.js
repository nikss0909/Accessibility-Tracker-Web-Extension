import { Router } from "express";
import { listUsers, updateProfile } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("admin", "owner", "manager"), listUsers);
router.patch("/me", updateProfile);

export default router;
