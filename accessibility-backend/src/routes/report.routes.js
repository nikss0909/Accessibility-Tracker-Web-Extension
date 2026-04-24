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

/* PUBLIC ROUTE FIRST */
router.post("/extension", createReportFromExtension);

/* AUTH ROUTES BELOW */
router.use(requireAuth);

router.get("/", listReports);
router.post("/", requireRole("admin", "owner", "manager", "member"), createReport);
router.post("/weekly-summary", requireRole("admin", "owner", "manager"), createWeeklySummary);
router.get("/:reportId", getReport);
router.patch("/:reportId/archive", requireRole("admin", "owner", "manager"), archiveReport);

export default router;