import "dotenv/config";
import "express-async-errors";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss-clean";

// Route Imports
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import userAuthRoutes from "./routes/userAuth.js";
import adminUsersRoutes from "./routes/users.js";
import hostRoutes from "./routes/hosts.js";
import agencyRoutes from "./routes/agencies.js";
import economyRoutes from "./routes/economy.js";
import reportRoutes from "./routes/reports.js";
import callRoutes from "./routes/calls.js";
import chatRoutes from "./routes/chat.js";
import growthRoutes from "./routes/growth.js";
import vipRoutes from "./routes/vip.js";
import settingsRoutes from "./routes/settings.js";
import monitoringRoutes from "./routes/monitoring.js";
import verificationRoutes from "./routes/verification.js";
import notificationsRoutes from "./routes/notifications.js";
import walletRoutes from "./routes/wallet.js";
import paymentsRoutes from "./routes/payments.js";

import { protectAdmin, protectUser } from "./middleware/authMiddleware.js";
import errorHandler from "./middleware/errorMiddleware.js";
import { seedAdmin, seedInterests } from "./utils/initDb.js";

const app = express();
const server = http.createServer(app);

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors({ origin: "*", credentials: true }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// Public Routes
app.get("/", (req, res) => res.send("Welcome to Kairo API. Use /api/health for status."));
app.use("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/economy", economyRoutes); // Public coins fetching

// User Routes
app.use("/api/user/auth", userAuthRoutes);
app.use("/api/user/payments", paymentsRoutes);
app.use("/api/verification", protectUser, verificationRoutes);
app.use("/api/wallet", protectUser, walletRoutes);
app.use("/api/chat", protectUser, chatRoutes);
app.use("/api/calls", protectUser, callRoutes);

// Admin Routes (Standardized Prefix: /api/admin/...)
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/dashboard", protectAdmin, dashboardRoutes);
app.use("/api/admin/users", protectAdmin, adminUsersRoutes);
app.use("/api/admin/hosts", protectAdmin, hostRoutes);
app.use("/api/admin/agencies", protectAdmin, agencyRoutes);
app.use("/api/admin/economy", protectAdmin, economyRoutes);
app.use("/api/admin/verification", protectAdmin, verificationRoutes);
app.use("/api/admin/monitoring", protectAdmin, monitoringRoutes);
app.use("/api/admin/reports", protectAdmin, reportRoutes);
app.use("/api/admin/notifications", protectAdmin, notificationsRoutes);
app.use("/api/settings", settingsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedAdmin();
    await seedInterests();
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ Connection Error:", err));
