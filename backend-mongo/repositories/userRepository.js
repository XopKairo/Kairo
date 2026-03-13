import User from "../models/User.js";

class UserRepository {
  async findById(userId, session) {
    const query = User.findOne({ _id: userId, isDeleted: { $ne: true } });
    if (session) query.session(session);
    return await query;
  }

  // Raw fetch including deleted users (for Admin review or restoration)
  async findRawById(userId) {
    return await User.findById(userId);
  }

  async findByContact(contact) {
    return await User.findOne({ phone: contact, isDeleted: { $ne: true } });
  }

  async findByPhone(phone) {
    const cleanPhone = phone ? phone.toString().trim().replace(/\s+/g, "") : "";
    return await User.findOne({ phone: cleanPhone, isDeleted: { $ne: true } });
  }

  async createUser(userData) {
    return await User.create(userData);
  }

  async updateLoginPoints(userId) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $inc: { zoraPoints: 5 },
        $set: { lastLoginDate: new Date() },
      },
      { new: true },
    );
  }

  async deleteById(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async updateCoinsAtomics(userId, amountNum, session) {
    return await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: amountNum } },
      { $inc: { coins: -amountNum } },
      { session, new: true },
    );
  }

  async updateAdStats(userId, rewardAmount, isSameDay, limit, now) {
    const query = { _id: userId };

    // If it's the same day, ensure we haven't hit the limit
    if (isSameDay) {
      query.dailyAdsWatched = { $lt: limit };
    }

    const update = {
      $inc: {
        coins: rewardAmount,
        dailyAdsWatched: isSameDay ? 1 : 0,
      },
      $set: { lastAdWatchedAt: now },
    };

    // If it's a new day, reset dailyAdsWatched to 1
    if (!isSameDay) {
      update.$set.dailyAdsWatched = 1;
    }

    return await User.findOneAndUpdate(query, update, { new: true });
  }
}

export default new UserRepository();
