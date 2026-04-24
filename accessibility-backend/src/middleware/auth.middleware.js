import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }

    next();
  };
}

export function requireTeamAccess(req, res, next) {
  const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
  if (!teamId || req.user.role === "admin" || req.user.teamId?.toString() === teamId.toString()) {
    return next();
  }

  res.status(403).json({ message: "Team access denied" });
}
