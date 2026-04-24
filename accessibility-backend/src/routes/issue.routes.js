import { Router } from "express";
import { addComment, createIssue, getIssueSummary, listIssues, updateIssue } from "../controllers/issue.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listIssues);
router.post("/", requireRole("admin", "owner", "manager", "member"), createIssue);
router.get("/summary", getIssueSummary);
router.patch("/:issueId", requireRole("admin", "owner", "manager", "member"), updateIssue);
router.post("/:issueId/comments", requireRole("admin", "owner", "manager", "member"), addComment);

export default router;
