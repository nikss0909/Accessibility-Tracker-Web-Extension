import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      teamId: user.teamId?.toString()
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
