import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sanitizeUser } from "./auth.controller.js";

export const listUsers = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.teamId ? { teamId: req.query.teamId } : { teamId: req.user.teamId };
  const users = await User.find(query).sort({ createdAt: -1 });
  res.json({ users: users.map(sanitizeUser) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name,
    title: req.body.title
  };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({ user: sanitizeUser(user) });
});
