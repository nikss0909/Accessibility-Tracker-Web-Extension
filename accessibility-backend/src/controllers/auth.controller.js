import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/tokens.js";

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const team = await Team.create({
    name: company || `${name}'s Team`,
    slug: `${company || name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  });

  const user = await User.create({
    name,
    email,
    passwordHash: await User.hashPassword(password),
    role: "owner",
    teamId: team._id
  });

  team.ownerId = user._id;
  await team.save();

  res.status(201).json({
    token: signToken(user),
    user: sanitizeUser(user),
    team
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    token: signToken(user),
    user: sanitizeUser(user)
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("teamId", "name slug plan");
  res.json({ user: sanitizeUser(user) });
});

export function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    title: user.title,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}
