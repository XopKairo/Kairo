import Gift from "../models/Gift.js";
import Follow from "../models/Follow.js";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import WalletLedger from "../models/WalletLedger.js";
import mongoose from "mongoose";

class InteractionController {
  // --- Gifting ---
  async getGifts(req, res) {
    try {
      const gifts = await Gift.find({ isActive: true });
      res.json(gifts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async sendGift(req, res) {
    const { giftId, receiverId, callId } = req.body;
    const senderId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const gift = await Gift.findById(giftId).session(session);
      if (!gift) throw new Error("Gift not found");

      const sender = await User.findById(senderId).session(session);
      if (sender.coins < gift.coinCost) throw new Error("Insufficient coins");

      const receiver = await User.findById(receiverId).session(session);
      if (!receiver) throw new Error("Receiver not found");

      // Deduct from sender
      sender.coins -= gift.coinCost;
      await sender.save({ session });

      // Add to receiver (Host) - usually a percentage or full
      // For now, full amount as earnings
      receiver.earnings += gift.coinCost;
      await receiver.save({ session });

      // Log transactions
      await WalletLedger.create(
        [
          {
            userId: senderId,
            type: "DEBIT",
            amount: gift.coinCost,
            transactionType: "GIFT_SENT",
            details: `Sent ${gift.name} to ${receiver.name}`,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      res.json({ success: true, newBalance: sender.coins });
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: error.message });
    } finally {
      session.endSession();
    }
  }

  // --- Following ---
  async followUser(req, res) {
    const { followeeId } = req.body;
    const followerId = req.user._id;
    try {
      await Follow.create({ followerId, followeeId });
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
