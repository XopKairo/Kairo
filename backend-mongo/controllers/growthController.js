import growthService from "../services/growthService.js";

class GrowthController {
  async claimDailyReward(req, res) {
    try {
      const result = await growthService.claimDailyReward(req.user._id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLeaderboards(req, res) {
    try {
      const { type, period } = req.query; // type: hosts or spenders
      let result;
      if (type === "hosts") {
        result = await growthService.getTopHosts(period);
      } else {
        result = await growthService.getTopSpenders(period);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getReferralStats(req, res) {
    try {
      const user = req.user;
      res.json({
        referralCode: user.referralCode,
        currentStreak: user.currentStreak,
        level: user.level,
        vipLevel: user.vipLevel,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new GrowthController();
