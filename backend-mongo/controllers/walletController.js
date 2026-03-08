import walletService from "../services/walletService.js";

class WalletController {
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
