import walletService from "../services/walletService.js";
import Call from "../models/Call.js";
import WalletLedger from "../models/WalletLedger.js";
import Host from "../models/Host.js";

class WalletController {
  async getHistory(req, res) {
    try {
      const userId = req.user._id;
      
      const calls = await Call.find({ userId }).populate("hostId", "name profilePicture").sort({ createdAt: -1 }).limit(20);
      const ledger = await WalletLedger.find({ userId }).sort({ createdAt: -1 }).limit(20);
      
      let hostEarnings = [];
      const host = await Host.findOne({ userId });
      if (host) {
        hostEarnings = await Call.find({ hostId: host._id, status: "Completed" }).populate("userId", "name profilePicture").sort({ createdAt: -1 }).limit(20);
      }

      res.json({
        success: true,
        calls,
        ledger,
        hostEarnings
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async withdraw(req, res) {
    try {
      const result = await walletService.processWithdrawal(req.body);

      // Handle IO alert if successful
      if (result.success && req.io && !req.body.isAdminWithdrawal) {
        req.io.to("admin-room").emit("payoutRequestAlert", {
          message: `New withdrawal request from ${result.user.name}: ₹${result.amountINR}`,
          userId: req.body.userId,
          amountINR: result.amountINR,
        });
      }

      res.json({
        success: true,
        message: result.message,
        newBalance: result.newBalance,
        amountINR: result.amountINR,
      });
    } catch (error) {
      if (error.message === "DUPLICATE_REQUEST") {
        return res
          .status(409)
          .json({
            success: false,
            message: "Duplicate withdrawal request detected",
          });
      }
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async earnAd(req, res) {
    try {
      const { userId, clientRequestId } = req.body;
      const result = await walletService.processEarnAd(userId, clientRequestId);
      res.json(result);
    } catch (error) {
      if (error.message === "DUPLICATE_REQUEST") {
        return res
          .status(409)
          .json({
            success: false,
            message: "Duplicate ad reward request detected",
          });
      }
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getCoinPackages(req, res) {
    try {
      const packages = await walletService.getCoinPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new WalletController();
