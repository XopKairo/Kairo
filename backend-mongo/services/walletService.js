import mongoose from 'mongoose';
import walletRepository from '../repositories/walletRepository.js';
import userRepository from '../repositories/userRepository.js';
import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';

const COIN_TO_INR_RATE = 0.1;

class WalletService {
  async processWithdrawal(data) {
    const { userId, amountCoins, paymentDetails, isAdminWithdrawal, clientRequestId } = data;
    
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Check for duplicate request
      const existingRequest = await walletRepository.findPayoutByClientRequestId(clientRequestId, session);
      if (existingRequest) {
        throw new Error('DUPLICATE_REQUEST');
      }

      if (!userId || !amountCoins || !paymentDetails) {
        throw new Error('User ID, amount in coins, and payment details are required');
      }

      const amountNum = Number(amountCoins);
      const amountINR = Number((amountNum * COIN_TO_INR_RATE).toFixed(2));

      // Admin Payout Logic
      if (isAdminWithdrawal) {
        const admin = await Admin.findById(userId).session(session);
        if (!admin || admin.totalRevenue < amountINR) throw new Error('Insufficient Admin revenue');
        
        admin.totalRevenue -= amountINR;
        await admin.save({ session });

        await walletRepository.createPayout({
          user: userId,
          amountINR,
          coinsDeducted: 0,
          paymentDetails,
          status: 'Approved',
          clientRequestId
        }, session);

        await session.commitTransaction();
        return { success: true, message: 'Admin withdrawal submitted', amountINR };
      }

      // Normal User/Host Logic
      const user = await userRepository.findById(userId, session);
      if (!user) throw new Error('User not found');

      if (user.gender === 'Male') {
        throw new Error('Withdrawal is only available for Female Hosts');
      }

      if (user.coins < amountNum) {
        throw new Error('Insufficient coins in wallet');
      }

      if (amountINR < 500) {
        throw new Error('Minimum withdrawal amount is ₹500');
      }

      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const dailyPayouts = await walletRepository.findPayoutsByUserAndDate(userId, startOfDay, session);
      const dailyTotal = dailyPayouts.reduce((sum, p) => sum + p.amountINR, 0);
      if (dailyTotal + amountINR > 2000) {
        throw new Error('Daily withdrawal limit exceeded (Max ₹2000/day)');
      }

      // Create Payout Request
      await walletRepository.createPayout({
        user: userId,
        amountINR,
        coinsDeducted: amountNum,
        paymentDetails,
        status: 'Pending',
        clientRequestId
      }, session);

      // ATOMIC DEDUCTION
      const balanceBefore = user.coins;
      const updatedUser = await userRepository.updateCoinsAtomics(userId, amountNum, session);

      if (!updatedUser) {
        throw new Error('Insufficient coins or user not found during atomic update');
      }

      // LEDGER LOGGING
      await walletRepository.logLedgerEntry({
        userId,
        type: 'DEBIT',
        amount: amountNum,
        balanceBefore,
        balanceAfter: updatedUser.coins,
        transactionType: 'WITHDRAWAL',
        description: `Withdrawal request for ₹${amountINR}`,
        clientRequestId
      }, session);

      await session.commitTransaction();

      return { 
        success: true, 
        message: 'Withdrawal request submitted successfully.', 
        newBalance: updatedUser.coins,
        amountINR,
        user: user // For IO notification
      };

    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async processEarnAd(userId, clientRequestId) {
    if (!clientRequestId) {
      throw new Error('clientRequestId is required for idempotency');
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Check for duplicate ad reward request
      // We can use a dedicated collection or a cache for this.
      // For now, let's use a simple cache or a temporary flag.
      // But a better way is to log it in Transaction with a unique orderId
      const existingTx = await mongoose.model('Transaction').findOne({ orderId: clientRequestId }).session(session);
      if (existingTx) {
        throw new Error('DUPLICATE_REQUEST');
      }

      const settings = await Settings.findOne().session(session);
      const limit = settings ? settings.dailyLimit : 10;
      const rewardAmount = settings ? settings.rewardPerAd : 5;
      
      const user = await userRepository.findById(userId, session);
      if (!user) throw new Error("User not found");
      
      const now = new Date();
      const isSameDay = user.lastAdWatchedAt && user.lastAdWatchedAt.toDateString() === now.toDateString();
      
      if (isSameDay && user.dailyAdsWatched >= limit) {
        throw new Error("Daily ad limit reached");
      }

      // ATOMIC UPDATE
      const balanceBefore = user.coins;
      const updatedUser = await userRepository.updateAdStats(userId, rewardAmount, isSameDay, limit, now);
      
      if (!updatedUser) {
        throw new Error("Failed to update ad stats (Possible limit reached)");
      }

      // LEDGER LOGGING
      await walletRepository.logLedgerEntry({
        userId,
        type: 'CREDIT',
        amount: rewardAmount,
        balanceBefore,
        balanceAfter: updatedUser.coins,
        transactionType: 'AD_REWARD',
        description: `Earned ${rewardAmount} coins via Ad`,
        clientRequestId
      }, session);

      // Log the ad reward as a transaction
      await mongoose.model('Transaction').create([{
        userId,
        amount: 0, // Ad reward doesn't involve INR
        orderId: clientRequestId,
        status: 'completed',
        coinsCredited: rewardAmount
      }], { session });

      await session.commitTransaction();
      return { success: true, message: "You earned " + rewardAmount + " coins!", newBalance: updatedUser.coins };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getCoinPackages() {
    return await walletRepository.getActiveCoinPackages();
  }
}

export default new WalletService();
