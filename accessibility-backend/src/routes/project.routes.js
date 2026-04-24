import { Router } from "express";
import {
  addWebsite,
  createProject,
  getProject,
  listProjects,
  removeWebsite,
  updateProject,
  updateWebsite
} from "../controllers/project.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listProjects);
router.post("/", requireRole("admin", "owner", "manager"), createProject);
router.get("/:projectId", getProject);
router.patch("/:projectId", requireRole("admin", "owner", "manager"), updateProject);
router.post("/:projectId/websites", requireRole("admin", "owner", "manager"), addWebsite);
router.patch("/:projectId/websites/:websiteId", requireRole("admin", "owner", "manager"), updateWebsite);
router.delete("/:projectId/websites/:websiteId", requireRole("admin", "owner", "manager"), removeWebsite);

export default router;
