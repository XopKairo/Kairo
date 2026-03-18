import Gift from "../models/Gift.js";
import Follow from "../models/Follow.js";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import Host from "../models/Host.js";
import Agency from "../models/Agency.js";
import Settings from "../models/Settings.js";
import WalletLedger from "../models/WalletLedger.js";
import Admin from "../models/Admin.js";
import Call from "../models/Call.js";
import mongoose from "mongoose";

class InteractionController {
  async getGifts(req, res) {
    try {
      const gifts = await Gift.find({ isActive: true });
      res.json(gifts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async sendGift(req, res) {
    const { giftId, receiverId } = req.body;
    const senderId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const gift = await Gift.findById(giftId).session(session);
      if (!gift) throw new Error("Gift not found");

      const sender = await User.findById(senderId).session(session);
      if (sender.coins < gift.coinCost) throw new Error("Insufficient coins");

      const receiverHost = await Host.findById(receiverId).session(session);
      if (!receiverHost) throw new Error("Host not found");

      let settings = await Settings.findOne().session(session);
      const adminCommissionPercent = settings?.giftCommission || 30;
      
      const giftTotalValue = gift.coinCost;
      const adminShare = giftTotalValue * (adminCommissionPercent / 100);
      const hostTotalShare = giftTotalValue - adminShare;

      let hostFinalShare = hostTotalShare;
      let agencyShare = 0;

      if (receiverHost.agencyId) {
         const agency = await Agency.findById(receiverHost.agencyId).session(session);
         if (agency) {
            agencyShare = hostTotalShare * (agency.commissionPercentage / 100);
            hostFinalShare = hostTotalShare - agencyShare;
            
            agency.balance += agencyShare;
            agency.totalEarnings += agencyShare;
            await agency.save({ session });
         }
      }

      // Update Balances
      sender.coins -= giftTotalValue;
      await sender.save({ session });

      receiverHost.earnings += hostFinalShare;
      await receiverHost.save({ session });

      // SYNC with User's cashBalance for Admin Panel and Profile consistency
      await User.findByIdAndUpdate(receiverHost.userId, { $inc: { cashBalance: hostFinalShare } }).session(session);

      // Update Admin Revenue
      const adminShareINR = Number((adminShare * 0.1).toFixed(2));
      await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } }).session(session);

      // Log transactions
      await WalletLedger.create([
        {
          userId: senderId,
          type: "DEBIT",
          amount: giftTotalValue,
          transactionType: "GIFT_SENT",
          details: `Sent ${gift.name} to ${receiverHost.name}`,
        }
      ], { session });

      await session.commitTransaction();
      res.json({ success: true, newBalance: sender.coins, reward: hostFinalShare });
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      res.status(400).json({ success: false, message: error.message });
    } finally {
      session.endSession();
    }
  }

  // --- Following ---
  async followUser(req, res) {
    const { followeeId } = req.body; // Host's User ID
    const followerId = req.user._id;
    try {
      if (followeeId === followerId.toString()) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      await Follow.create({ followerId, followeeId });

      const host = await Host.findOne({ userId: followeeId });

      // Update Current User (denormalized data for performance)
      const userUpdate = { $addToSet: { following: followeeId } };
      if (host) {
        userUpdate.$addToSet.favoriteHosts = host._id;
      }
      await User.findByIdAndUpdate(followerId, userUpdate);

      // Update Followed User and Host
      await User.findByIdAndUpdate(followeeId, { $addToSet: { followers: followerId } });
      if (host) {
        await Host.findByIdAndUpdate(host._id, { $addToSet: { followers: followerId } });
      }

      res.json({ success: true, message: "Followed successfully" });
    } catch (error) {
      if (error.code === 11000)
        return res.json({ success: true, message: "Already following" });
      res.status(400).json({ message: error.message });
    }
  }

  async unfollowUser(req, res) {
    const { followeeId } = req.params;
    const followerId = req.user._id;
    try {
      await Follow.findOneAndDelete({ followerId, followeeId });

      const host = await Host.findOne({ userId: followeeId });

      // Update Current User
      const userUpdate = { $pull: { following: followeeId } };
      if (host) {
        userUpdate.$pull.favoriteHosts = host._id;
      }
      await User.findByIdAndUpdate(followerId, userUpdate);
      // Update Followed User and Host
      await User.findByIdAndUpdate(followeeId, { $pull: { followers: followerId } });
      if (host) {
        await Host.findByIdAndUpdate(host._id, { $pull: { followers: followerId } });
      }

      res.json({ success: true, message: "Unfollowed successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getFollowStatus(req, res) {
    const { userId } = req.params;
    const myId = req.user._id;
    try {
      const isFollowing = await Follow.exists({
        followerId: myId,
        followeeId: userId,
      });
      res.json({ isFollowing: !!isFollowing });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // --- Liking ---
  async getLikeStatus(req, res) {
    const { hostId } = req.params;
    const userId = req.user._id;
    try {
      // Find latest completed call that hasn't been liked
      const unlikedCall = await Call.findOne({
        userId,
        hostId,
        status: "Completed",
        hasLiked: false,
      }).sort({ createdAt: -1 });

      res.json({ canLike: !!unlikedCall });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async likeHost(req, res) {
    const { hostId } = req.body;
    const userId = req.user._id;
    try {
      const unlikedCall = await Call.findOne({
        userId,
        hostId,
        status: "Completed",
        hasLiked: false,
      }).sort({ createdAt: -1 });

      if (!unlikedCall) {
        return res.status(400).json({ 
          message: "You must call this host before liking them again!" 
        });
      }

      // Mark call as liked
      unlikedCall.hasLiked = true;
      await unlikedCall.save();

      // Update Host Ranking and Like count
      await Host.findByIdAndUpdate(hostId, {
        $inc: { rankingScore: 10, likes: 1 }
      });

      res.json({ success: true, message: "Host liked!" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // --- Rating ---
  async submitRating(req, res) {
    try {
      const { hostId, stars, comment, callId } = req.body;
      const rating = await Rating.create({
        userId: req.user._id,
        hostId,
        stars,
        comment,
        callId,
      });
      res.status(201).json({ success: true, rating });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new InteractionController();
