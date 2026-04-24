import { Router } from "express";
import { createScan, deleteScan, getScan, getScanAnalytics, listScans } from "../controllers/scan.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listScans);
router.post("/", requireRole("admin", "owner", "manager", "member"), createScan);
router.get("/analytics", getScanAnalytics);
router.get("/:scanId", getScan);
router.delete("/:scanId", requireRole("admin", "owner", "manager"), deleteScan);

export default router;
