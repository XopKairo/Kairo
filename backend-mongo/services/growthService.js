import mongoose from "mongoose";
import User from "../models/User.js";
import walletRepository from "../repositories/walletRepository.js";
import userRepository from "../repositories/userRepository.js";

class GrowthService {
  // 1. Daily Streak System
  async claimDailyReward(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const now = new Date();
    const todayStr = now.toDateString();

    if (
      user.lastStreakClaimedAt &&
      user.lastStreakClaimedAt.toDateString() === todayStr
    ) {
      throw new Error("Already claimed today");
    }

    // Check if streak is broken (more than 1 day since last claim)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      !user.lastStreakClaimedAt ||
      user.lastStreakClaimedAt.toDateString() !== yesterday.toDateString()
    ) {
      user.currentStreak = 1;
    } else {
      user.currentStreak += 1;
    }

    // Determine Reward based on Streak
    let reward = 10;
    if (user.currentStreak % 7 === 0) reward = 50; // Week bonus
    if (user.currentStreak % 30 === 0) reward = 250; // Month bonus

    const balanceBefore = user.coins;
    user.coins += reward;
    user.lastStreakClaimedAt = now;

    // Auto-VIP for 7-day streak? (Temporary/Trial)
    if (user.currentStreak === 7) user.vipLevel = "Bronze";

    await user.save();

    // Log Ledger
    await walletRepository.logLedgerEntry({
      userId,
      type: "CREDIT",
      amount: reward,
      balanceBefore,
      balanceAfter: user.coins,
      transactionType: "ADMIN_ADJUSTMENT", // Using adjustment as reward type
      description: `Daily Streak Reward: Day ${user.currentStreak}`,
    });

    return {
      success: true,
      reward,
      currentStreak: user.currentStreak,
      newBalance: user.coins,
    };
  }

  // 2. Level Up Logic (Triggered on spending)
  async updateSpentAndLevel(userId, coinsSpent) {
    const user = await User.findById(userId);
    if (!user) return;

    user.totalSpent += coinsSpent;

    // Simple level logic: every 500 coins spent = 1 level
    const newLevel = Math.floor(user.totalSpent / 500) + 1;

    if (newLevel > user.level) {
      user.level = newLevel;
      // Bonus coins on level up?
      // user.coins += 10;
    }

    // VIP Logic based on spending
    if (user.totalSpent > 10000) user.vipLevel = "Platinum";
    else if (user.totalSpent > 5000) user.vipLevel = "Gold";
    else if (user.totalSpent > 2500) user.vipLevel = "Silver";
    else if (user.totalSpent > 1000) user.vipLevel = "Bronze";

    await user.save();
  }

  // 3. Referral Logic
  async processReferral(newUserId, referralCode) {
    if (!referralCode) return;

    const referrer = await User.findOne({ referralCode });
    if (!referrer) return;

    const newUser = await User.findById(newUserId);
    if (!newUser || newUser.referredBy) return;

    newUser.referredBy = referrer._id;

    // Reward both (Referrer: 20, New User: 10)
    const referrerBefore = referrer.coins;
    referrer.coins += 20;
    await referrer.save();

    await walletRepository.logLedgerEntry({
      userId: referrer._id,
      type: "CREDIT",
      amount: 20,
      balanceBefore: referrerBefore,
      balanceAfter: referrer.coins,
      transactionType: "ADMIN_ADJUSTMENT",
      description: `Referral Reward: Invited ${newUser.name}`,
    });

    const newUserBefore = newUser.coins;
    newUser.coins += 10;
    await newUser.save();

    await walletRepository.logLedgerEntry({
      userId: newUser._id,
      type: "CREDIT",
      amount: 10,
      balanceBefore: newUserBefore,
      balanceAfter: newUser.coins,
      transactionType: "ADMIN_ADJUSTMENT",
      description: `Referral Reward: Joined using ${referrer.name}'s code`,
    });
  }

  // 4. Leaderboards (Aggregated)
  async getTopSpenders(period = "daily") {
    const now = new Date();
    let startDate = new Date();
    if (period === "daily") startDate.setHours(0, 0, 0, 0);
    else if (period === "weekly") startDate.setDate(now.getDate() - 7);

    // Query WalletLedger for DEBIT transactions in the period
    return await mongoose
      .model("WalletLedger")
      .aggregate([
        { $match: { type: "DEBIT", createdAt: { $gte: startDate } } },
        { $group: { _id: "$userId", totalSpent: { $sum: "$amount" } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: { "user.name": 1, "user.profilePicture": 1, totalSpent: 1 },
        },
      ]);
  }

  async getTopHosts(period = "daily") {
    const now = new Date();
    let startDate = new Date();
    if (period === "daily") startDate.setHours(0, 0, 0, 0);
    else if (period === "weekly") startDate.setDate(now.getDate() - 7);

    return await mongoose
      .model("Call")
      .aggregate([
        { $match: { status: "Completed", createdAt: { $gte: startDate } } },
        { $group: { _id: "$hostId", totalEarnings: { $sum: "$hostEarning" } } },
        { $sort: { totalEarnings: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            "user.name": 1,
            "user.profilePicture": 1,
            totalEarnings: 1,
          },
        },
      ]);
  }
}

export default new GrowthService();
