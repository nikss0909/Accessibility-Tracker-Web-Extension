import { Router } from "express";
import { inviteMember, listMembers, listTeams, updateMemberRole, updateTeam } from "../controllers/team.controller.js";
import { requireAuth, requireRole, requireTeamAccess } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listTeams);
router.patch("/:teamId", requireRole("admin", "owner"), requireTeamAccess, updateTeam);
router.get("/:teamId/members", requireTeamAccess, listMembers);
router.post("/:teamId/members", requireRole("admin", "owner", "manager"), requireTeamAccess, inviteMember);
router.patch("/:teamId/members/:userId", requireRole("admin", "owner"), requireTeamAccess, updateMemberRole);

export default router;
