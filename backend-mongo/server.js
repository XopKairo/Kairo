import "dotenv/config";
import "express-async-errors";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import setupSockets from "./sockets/socket.js";

// Admin Route Imports
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminUsersRoutes from "./routes/users.js";
import hostRoutes from "./routes/hosts.js";
import agencyRoutes from "./routes/agencies.js";
import economyRoutes from "./routes/economy.js";
import monitoringRoutes from "./routes/monitoring.js";
import reportRoutes from "./routes/reports.js";
import notificationsRoutes from "./routes/notifications.js";
import settingsRoutes from "./routes/settings.js";
import payoutRoutes from "./routes/payouts.js";
import bannerRoutes from "./routes/banners.js";
import ticketRoutes from "./routes/tickets.js";
import adminPostsRoutes from "./routes/posts.js";
import adminRoutes from "./routes/admin.js";
import interestsRoutes from "./routes/interests.js";

// User Route Imports
import userAuthRoutes from "./routes/userAuth.js";
import paymentsRoutes from "./routes/payments.js";
import userVerificationRoutes from "./routes/verification.js";
import walletRoutes from "./routes/wallet.js";
import chatRoutes from "./routes/chat.js";
import callRoutes from "./routes/calls.js";
import growthRoutes from "./routes/growth.js";
import vipRoutes from "./routes/vip.js";
import reviewRoutes from "./routes/reviews.js";
import interactionRoutes from "./routes/interactions.js";

import { protectAdmin, protectUser } from "./middleware/authMiddleware.js";
import errorHandler from "./middleware/errorMiddleware.js";
import { seedAdmin, seedInterests, seedPackages } from "./utils/initDb.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

setupSockets(io);

// God-Mode Security: Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { message: "System busy. Too many requests. Try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, 
  message: { message: "Too many login/auth attempts. Wait 15 minutes." }
});

// Standard Middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors({ origin: "*", credentials: true }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(globalLimiter);

// Health
app.get("/", (req, res) => res.send("ZORA SUPREME API Active."));
app.use("/api/health", (req, res) => res.json({ status: "ok" }));

// PUBLIC ROUTES
app.use("/api/public/economy", economyRoutes);
app.use("/api/public/settings", settingsRoutes);
app.use("/api/public/interests", interestsRoutes);
app.use("/api/public/banners", bannerRoutes);
app.use("/api/public/hosts", hostRoutes);

// USER ROUTES
app.use("/api/user/auth", authLimiter, userAuthRoutes);
app.use("/api/user/payments", paymentsRoutes);
app.use("/api/user/verification", protectUser, userVerificationRoutes);
app.use("/api/user/wallet", protectUser, walletRoutes);
app.use("/api/user/chat", protectUser, chatRoutes);
app.use("/api/user/calls", protectUser, callRoutes);
app.use("/api/user/growth", protectUser, growthRoutes);
app.use("/api/user/vip", protectUser, vipRoutes);
app.use("/api/user/reviews", protectUser, reviewRoutes);
app.use("/api/user/users", protectUser, adminUsersRoutes);

// ADMIN ROUTES
app.use("/api/admin/auth", authLimiter, authRoutes);
app.use("/api/admin/dashboard", protectAdmin, dashboardRoutes);
app.use("/api/admin/users", protectAdmin, adminUsersRoutes);
app.use("/api/admin/hosts", protectAdmin, hostRoutes);
app.use("/api/admin/verification", protectAdmin, userVerificationRoutes);
app.use("/api/admin/agencies", protectAdmin, agencyRoutes);
app.use("/api/admin/economy", protectAdmin, economyRoutes);
app.use("/api/admin/monitoring", protectAdmin, monitoringRoutes);
app.use("/api/admin/payouts", protectAdmin, payoutRoutes);
app.use("/api/admin/reports", protectAdmin, reportRoutes);
app.use("/api/admin/notifications", protectAdmin, notificationsRoutes);
app.use("/api/admin/settings", protectAdmin, settingsRoutes);
app.use("/api/admin/banners", protectAdmin, bannerRoutes);
app.use("/api/admin/tickets", protectAdmin, ticketRoutes);
app.use("/api/admin/posts", protectAdmin, adminPostsRoutes);
app.use("/api/admin/interests", protectAdmin, interestsRoutes);
app.use("/api/admin", protectAdmin, adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log("✅ God-Mode Database Synced");
    await seedAdmin();
    await seedInterests();
    await seedPackages();
    server.listen(PORT, () => console.log(`🚀 Kairo Engine Active on ${PORT}`));
  });
