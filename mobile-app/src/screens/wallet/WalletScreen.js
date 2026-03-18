import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, SafeAreaView, StatusBar, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { initRewardedAd, showRewardedAd } from '../../services/adService';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';
import ZoraAlert from '../../components/ZoraAlert';
import { Wallet, Play, ArrowUpRight, Info, CheckCircle2, History } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';

const WalletScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [coinRate, setCoinRate] = useState(0.1);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });
  
  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const fetchUserData = async () => {
    try {
      const res = await api.get('user/auth/me');
      if (res.data) {
        setUser(res.data);
        await AsyncStorage.setItem('userData', JSON.stringify(res.data));
      }
      
      const pkgRes = await api.get('public/economy/coins');
      setPackages(pkgRes.data || []);

      const settingsRes = await api.get('public/settings/app');
      if (settingsRes.data && settingsRes.data.coinToInrRate) {
        setCoinRate(settingsRes.data.coinToInrRate);
      }
    } catch (err) {
      console.log('Error fetching wallet data', err);
    }
  };

  useEffect(() => {
    fetchUserData();
    const cleanup = initRewardedAd(
      (newBalance) => {
        setUser(prev => ({...prev, coins: newBalance}));
        setAdLoading(false);
      },
      () => setAdLoading(false)
    );
    return cleanup;
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('user/payments/validate-coupon', {
        code: couponCode,
        amount: 100 
      });
      if (res.data.success) {
        setAppliedCoupon(res.data);
        showAlert('Coupon Applied!', `You saved ₹${res.data.discount}`, 'success');
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Invalid Coupon');
    }
  };

  const handlePurchase = async (pkg) => {
    const finalPrice = appliedCoupon ? Math.max(pkg.priceINR - appliedCoupon.discount, 1) : pkg.priceINR;
    setLoading(true);
    try {
      const res = await api.post('user/payments/create-razorpay-order', {
        amount: finalPrice,
        coins: pkg.coins + (pkg.bonus || 0),
        currency: 'INR'
      });
      
      const options = {
        description: `Purchase ${pkg.coins} Coins`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SPOBSULcN0TXIq', 
        amount: res.data.order.amount,
        name: 'ZORA Live',
        order_id: res.data.order.id,
        prefill: { email: `${user?.phone}@zora.com`, contact: user?.phone, name: user?.name },
        theme: { color: COLORS.primary }
      };

      RazorpayCheckout.open(options).then(async (data) => {
        try {
          const verifyRes = await api.post('user/payments/verify-razorpay', data);
          if (verifyRes.data.success) {
            showAlert('Success', 'Coins added to your wallet!', 'success');
            fetchUserData();
          } else { showAlert('Verification Failed', verifyRes.data.message || 'System could not verify payment.'); }
        } catch (vErr) { showAlert('Error', 'Server verification failed.'); }
      }).catch((error) => {
        if (error.code !== 2) showAlert('Payment Error', error.description || 'Payment process failed.');
      });
    } catch (err) {
      showAlert('Purchase Failed', err.response?.data?.message || 'Try again later.');
    } finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    const amountNum = Number(withdrawAmount);
    if (amountNum * coinRate < 500) return showAlert('Error', 'Min withdrawal is ₹500.');
    if (!upiId) return showAlert('Error', 'Enter UPI ID');
    if (user?.coins < amountNum) return showAlert('Error', 'Insufficient balance');

    setLoading(true);
    try {
      const res = await api.post('user/wallet/withdraw', {
        userId: user?._id || user?.id,
        amountCoins: amountNum,
        paymentDetails: `UPI: ${upiId}`,
        clientRequestId: `req_${Date.now()}`
      });
      if (res.data.success) {
        showAlert('Success', 'Withdrawal request submitted.', 'success');
        setWithdrawAmount('');
        fetchUserData();
      }
    } catch (error) { showAlert('Failed', error.response?.data?.error || 'Exceeded limits.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ZoraAlert 
        visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WALLET</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <History color={COLORS.textWhite} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={[COLORS.primary, COLORS.accentGlow]} style={styles.balanceCard}>
           <Wallet color="rgba(255,255,255,0.6)" size={40} style={styles.walletIcon} />
           <Text style={styles.balanceLabel}>{user?.isHost ? 'Earnings Balance' : 'Current Balance'}</Text>
           <Text style={styles.coinCount}>{user?.isHost ? (user?.earnings || 0) : (user?.coins || 0)}</Text>
           <Text style={styles.inrValue}>≈ ₹{((user?.isHost ? (user?.earnings || 0) : (user?.coins || 0)) * coinRate).toFixed(2)}</Text>
           {user?.isHost && (
             <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={[styles.balanceLabel, { fontSize: 10 }]}>Call Coins (Spent on calls): {user?.coins || 0}</Text>
             </View>
           )}
        </LinearGradient>

        {!user?.isHost && (
          <TouchableOpacity 
            style={styles.adCard} 
            onPress={() => { 
              setAdLoading(true);
              const shown = showRewardedAd(); 
              if (!shown) { setAdLoading(false); showAlert('Ad not ready', 'Please wait a moment.', 'notice'); }
            }}
            disabled={adLoading}
          >
            <View style={styles.adLeft}>
              <View style={styles.playBox}><Play color={COLORS.textWhite} size={20} fill={COLORS.textWhite} /></View>
              <View><Text style={styles.adTitle}>Free Coins</Text><Text style={styles.adSubtitle}>Watch ad & earn 5 coins</Text></View>
            </View>
            {adLoading ? <ActivityIndicator color={COLORS.accentGlow} /> : <ArrowUpRight color={COLORS.accentGlow} size={24} />}
          </TouchableOpacity>
        )}

        <View style={styles.storeSection}>
           <Text style={styles.sectionTitle}>Coin Store</Text>
           <View style={styles.packageGrid}>
              {packages.map((pkg) => (
                <TouchableOpacity key={pkg._id} style={styles.packageCard} onPress={() => handlePurchase(pkg)}>
                   {pkg.bonus > 0 && <View style={styles.bonusBadge}><Text style={styles.bonusText}>+{pkg.bonus}</Text></View>}
                   <Text style={styles.pkgCoins}>{pkg.coins}</Text>
                   <Text style={styles.pkgLabel}>Coins</Text>
                   <View style={styles.pkgPriceBox}><Text style={styles.pkgPrice}>₹{pkg.priceINR}</Text></View>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        {user?.isHost && (
          <View style={styles.withdrawSection}>
             <Text style={styles.sectionTitle}>Withdraw Funds</Text>
             <ZoraInput label="Amount in Coins" placeholder="Min 5000" value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="numeric" />
             <ZoraInput label="UPI ID" placeholder="yourname@upi" value={upiId} onChangeText={setUpiId} />
             <ZoraButton title="Request Withdrawal" onPress={handleWithdraw} loading={loading} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { padding: SPACING.lg },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textWhite, letterSpacing: 2 },
  content: { padding: SPACING.lg },
  balanceCard: { padding: 30, borderRadius: 30, alignItems: 'center', marginBottom: 25, position: 'relative', overflow: 'hidden' },
  walletIcon: { position: 'absolute', right: -10, top: -10, opacity: 0.2 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 'bold' },
  coinCount: { color: '#FFF', fontSize: 48, fontWeight: '900', marginVertical: 5 },
  inrValue: { color: '#FFF', fontSize: 18, opacity: 0.9, fontWeight: '600' },
  adCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBackground, padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  adLeft: { flexDirection: 'row', alignItems: 'center' },
  playBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  adTitle: { color: COLORS.textWhite, fontSize: 16, fontWeight: '700' },
  adSubtitle: { color: COLORS.textGray, fontSize: 12, marginTop: 2 },
  storeSection: { marginBottom: 30 },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  packageCard: { width: '31%', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)', position: 'relative' },
  bonusBadge: { position: 'absolute', top: -8, right: -5, backgroundColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, zIndex: 5 },
  bonusText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  pkgCoins: { color: COLORS.textWhite, fontSize: 18, fontWeight: '900' },
  pkgLabel: { color: COLORS.textGray, fontSize: 10, marginBottom: 10 },
  pkgPriceBox: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pkgPrice: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  withdrawSection: { backgroundColor: COLORS.cardBackground, padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  sectionTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: '800', marginBottom: 20 }
});

export default WalletScreen;
