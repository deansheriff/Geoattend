import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import employeeRoutes from "./routes/employee.js";
import healthRoutes from "./routes/health.js";
import { requireAuth } from "./middleware/auth.js";
import "./types.js";

const app = express();

const uploadsDir = process.env.UPLOADS_DIR || "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true
  })
);

app.use("/uploads", express.static(path.resolve(uploadsDir)));

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    id: req.user!.id,
    name: req.user!.name,
    email: req.user!.email,
    role: req.user!.role,
    timezone: req.user!.timezone
  });
});
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
