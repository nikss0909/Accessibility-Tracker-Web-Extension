import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sanitizeUser } from "./auth.controller.js";

export const listTeams = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { _id: req.user.teamId };
  const teams = await Team.find(query).sort({ createdAt: -1 });
  res.json({ teams });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndUpdate(
    req.params.teamId,
    { $set: { name: req.body.name, plan: req.body.plan } },
    { new: true, runValidators: true }
  );

  if (!team) return res.status(404).json({ message: "Team not found" });
  res.json({ team });
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ teamId: req.params.teamId }).sort({ createdAt: -1 });
  res.json({ members: members.map(sanitizeUser) });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const { name, email, role = "member" } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "A user with this email already exists" });
  }

  const temporaryPassword = `AT-${Math.random().toString(36).slice(2, 10)}`;
  const member = await User.create({
    name,
    email,
    role,
    teamId: req.params.teamId,
    passwordHash: await User.hashPassword(temporaryPassword)
  });

  res.status(201).json({
    member: sanitizeUser(member),
    temporaryPassword
  });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const member = await User.findOneAndUpdate(
    { _id: req.params.userId, teamId: req.params.teamId },
    { $set: { role: req.body.role, isActive: req.body.isActive } },
    { new: true, runValidators: true }
  );

  if (!member) return res.status(404).json({ message: "Member not found" });
  res.json({ member: sanitizeUser(member) });
});
