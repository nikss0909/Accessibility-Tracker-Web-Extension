import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/accessibility_tracker",
  jwtSecret: process.env.JWT_SECRET || "replace-this-secret-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  jsonLimit: process.env.JSON_LIMIT || "3mb",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
  trustProxy: process.env.TRUST_PROXY === "true"
};

if (env.jwtSecret === "replace-this-secret-in-production" && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}
