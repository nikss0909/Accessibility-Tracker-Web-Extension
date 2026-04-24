import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requestContext } from "./middleware/request.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import teamRoutes from "./routes/team.routes.js";
import projectRoutes from "./routes/project.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import reportRoutes from "./routes/report.routes.js";
import issueRoutes from "./routes/issue.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { logger } from "./utils/logger.js";

const app = express();

if (env.trustProxy) app.set("trust proxy", 1);

const allowedOrigins = env.corsOrigin === "*"
  ? "*"
  : env.corsOrigin.split(",").map((origin) => origin.trim());

app.use(requestContext);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: allowedOrigins !== "*"
}));
app.use(express.json({ limit: env.jsonLimit, strict: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev", { stream: logger.stream }));
app.use(rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("rate_limit_exceeded", { requestId: req.id, ip: req.ip, path: req.originalUrl });
    res.status(429).json({ message: "Too many requests. Please try again later." });
  }
}));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "accessibility-tracker-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/issues", issueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
