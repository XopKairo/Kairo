import Payout from '../models/Payout.js';
import CoinPackage from '../models/CoinPackage.js';
import WalletLedger from '../models/WalletLedger.js';

class WalletRepository {
  async logLedgerEntry(data, session) {
    return await WalletLedger.create([data], { session });
  }

  async findPayoutByClientRequestId(clientRequestId, session) {
    return await Payout.findOne({ clientRequestId }).session(session);
  }

  async findPayoutsByUserAndDate(userId, startOfDay, session) {
    return await Payout.find({ 
      user: userId, 
      createdAt: { $gte: startOfDay },
      status: { $ne: 'Rejected' }
    }).session(session);
  }

  async createPayout(payoutData, session) {
    return await Payout.create([payoutData], { session });
  }

  async getActiveCoinPackages() {
    return await CoinPackage.find({ isActive: true }).sort({ coins: 1 });
  }
}

export default new WalletRepository();
