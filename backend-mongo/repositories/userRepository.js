import User from "../models/User.js";

class UserRepository {
  async findById(userId, session) {
    const query = User.findById(userId);
    if (session) query.session(session);
    return await query;
  }

  async findByContact(contact) {
    return await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });
  }

  async findByEmailOrPhone(email, phone) {
    const query = [];
    if (email) query.push({ email: email.trim() });
    if (phone) query.push({ phone: phone.trim() });
    return await User.findOne({ $or: query });
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
