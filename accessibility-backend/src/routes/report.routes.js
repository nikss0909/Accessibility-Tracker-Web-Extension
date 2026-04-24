import { Router } from "express";
import {
  archiveReport,
  createReport,
  createReportFromExtension,
  createWeeklySummary,
  getReport,
  listReports
} from "../controllers/report.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listReports);
router.post("/", requireRole("admin", "owner", "manager", "member"), createReport);
router.post("/extension", requireRole("admin", "owner", "manager", "member"), createReportFromExtension);
router.post("/weekly-summary", requireRole("admin", "owner", "manager"), createWeeklySummary);
router.get("/:reportId", getReport);
router.patch("/:reportId/archive", requireRole("admin", "owner", "manager"), archiveReport);

export default router;
