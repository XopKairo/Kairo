import Host from "../models/Host.js";
import User from "../models/User.js";
import Call from "../models/Call.js";
import Report from "../models/Report.js";
import Blacklist from "../models/Blacklist.js";
import AdminActionLog from "../models/AdminActionLog.js";
import VerificationRequest from "../models/VerificationRequest.js";
import Transaction from "../models/Transaction.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";
import Review from "../models/Review.js";
import WalletLedger from "../models/WalletLedger.js";
import callService from "../services/callService.js";
import walletRepository from "../repositories/walletRepository.js";
import redisClient from "../config/redis.js";

class AdminController {

  // 1. Adjust User Wallet (Add/Remove Coins)
  async adjustWallet(req, res) {
    const { userId, amount, type, reason } = req.body; // type: 'ADD' or 'REMOVE'
    try {
      const user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const balanceBefore = user.coins;
      let newBalance;

      if (type === "ADD") {
        newBalance = balanceBefore + parseInt(amount);
      } else {
        newBalance = Math.max(0, balanceBefore - parseInt(amount));
      }

      user.coins = newBalance;
      await user.save();

      // Log Admin Action
      try {
        await AdminActionLog.create({
          adminId: req.admin?._id,
          action: "PAYMENT_OVERRIDE",
          targetId: userId,
          details: `${type} ${amount} coins. Reason: ${reason || "Manual adjust"}`,
        });
      } catch (logErr) {
        console.error("Logging failed:", logErr.message);
      }

      // Emit balance update
      if (req.io) {
        req.io.to(`user-${userId}`).emit("balanceUpdated", { newBalance });
      }

      // Log to Ledger
      await walletRepository.logLedgerEntry({
        userId,
        type: type === "ADD" ? "CREDIT" : "DEBIT",
        amount: parseInt(amount),
        balanceBefore,
        balanceAfter: newBalance,
        transactionType: "ADMIN_ADJUSTMENT",
        description: reason || `Admin ${type.toLowerCase()}ed coins`,
      });

      res.json({
        success: true,
        newBalance,
        message: `Successfully ${type.toLowerCase()}ed ${amount} coins`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Force End Active Call
  async forceEndCall(req, res) {
    const { callId } = req.body;
    try {
      const call = await Call.findOne({ callId, status: "Active" });
      if (!call)
        return res
          .status(404)
          .json({ success: false, message: "Active call not found" });

      const duration = Math.ceil((new Date() - call.startTime) / 60000);
      await callService.endCall(callId, duration);

      // Notify clients via Socket
      if (req.io) {
        req.io
          .to(`user-${call.userId}`)
          .emit("callTerminated", { reason: "Force terminated by admin" });
        req.io
          .to(`host-${call.hostId}`)
          .emit("callTerminated", { reason: "Force terminated by admin" });
      }

      res.json({ success: true, message: "Call force-terminated by Admin" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. Take Action on Report (Ban/Warn/Dismiss)
  async handleReportAction(req, res) {
    const { reportId, action, reason } = req.body; // action: 'BAN', 'WARN', 'DISMISS'
    try {
      const report = await Report.findById(reportId);
      if (!report)
        return res
          .status(404)
          .json({ success: false, message: "Report not found" });

      if (action === "BAN") {
        const user = await User.findById(report.reportedId);
        if (user) {
          user.isBanned = true;
          user.banReason = reason || "Violation reported by user";
          user.banUntil = new Date("9999-12-31");
          await user.save();

          // Log Admin Action
          try {
            await AdminActionLog.create({
              adminId: req.admin?._id,
              action: "BAN_USER",
              targetId: user._id,
              details: `Banned via report ${reportId}. Reason: ${reason}`,
            });
          } catch (logErr) {
            console.error("Logging failed:", logErr.message);
          }

          // Notify user via Socket
          if (req.io) {
            req.io
              .to(`user-${user._id}`)
              .emit("userBanned", { reason: user.banReason });
          }
        }
      }

      report.status = action === "DISMISS" ? "Resolved" : "Action Taken";
      report.adminNote = reason;
      await report.save();

      res.json({
        success: true,
        message: `Report handled with action: ${action}`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. Get System Overview
  async getOverview(req, res) {
    res.json({ success: true, message: "Admin Overview Path Ready" });
  }

  // 5. Get Audit Logs
  async getAuditLogs(req, res) {
    try {
      const logs = await AdminActionLog.find({})
        .populate("adminId", "name username email")
        .sort({ createdAt: -1 })
        .limit(100);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. Blacklist Management
  async getBlacklist(req, res) {
    try {
      const list = await Blacklist.find({}).sort({ createdAt: -1 });
      res.json(list);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addToBlacklist(req, res) {
    try {
      const { value, type, reason } = req.body;
      const item = await Blacklist.create({
        value,
        type: type || "IP",
        reason,
        adminId: req.admin?._id,
      });

      // Log Action
      try {
        await AdminActionLog.create({
          adminId: req.admin?._id,
          action: "BAN_USER",
          details: `Blacklisted ${type}: ${value}. Reason: ${reason}`,
        });
      } catch (logErr) {
        console.error("Blacklist logging failed:", logErr.message);
      }

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeFromBlacklist(req, res) {
    try {
      await Blacklist.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 7. Permanent Delete Host/User (Deep Cleanup)
  async deleteHostPermanently(req, res) {
    try {
      const { id } = req.params;
      
      // 1. Identify User ID
      let userId = id;
      const host = await Host.findById(id);
      if (host) {
        userId = host.userId;
      } else {
        const userCheck = await User.findById(id);
        if (!userCheck) return res.status(404).json({ success: false, message: "User/Host not found" });
      }

      console.log(`🚀 Purging all data for User: ${userId}`);

      // 2. Parallel Deep Delete (Surgical Purge)
      await Promise.all([
        User.findByIdAndDelete(userId),
        Host.deleteMany({ userId }),
        VerificationRequest.deleteMany({ userId }),
        Transaction.deleteMany({ userId }),
        Call.deleteMany({ $or: [{ userId }, { hostId: userId }] }),
        Report.deleteMany({ $or: [{ reporterId: userId }, { reportedId: userId }] }),
        Review.deleteMany({ $or: [{ userId }, { hostId: userId }] }),
        Post.deleteMany({ userId }),
        Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
        Conversation.deleteMany({ participants: userId }),
        Notification.deleteMany({ userId }),
        WalletLedger.deleteMany({ userId }),
        redisClient.del(`user_status:${userId}`) // Purge active session cache
      ]);

      // Log Admin Action
      try {
        await AdminActionLog.create({
          adminId: req.admin?._id,
          action: "BAN_USER",
          targetId: userId,
          details: `GOD-MODE: Permanently deleted user ${userId} and all associated records from system.`,
        });
      } catch (logErr) {
        console.error("Purge logging failed:", logErr.message);
      }

      res.json({ success: true, message: "User and all associated data completely purged from system." });
    } catch (error) {
      console.error("Deep Delete Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
