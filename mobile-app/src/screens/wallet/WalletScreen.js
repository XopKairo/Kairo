import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Text, SafeAreaView, StatusBar, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { initRewardedAd, showRewardedAd } from '../../services/adService';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';
import { Wallet, Play, ArrowUpRight, History, ShieldInfo, Info } from 'lucide-react-native';

const COIN_TO_INR_RATE = 0.1;

import RazorpayCheckout from 'react-native-razorpay';
import { Tag, CheckCircle2 } from 'lucide-react-native';

const WalletScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentType, setPaymentType] = useState('upi'); 
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/user/payments/validate-coupon', {
        code: couponCode,
        amount: 100 // placeholder amount for validation
      });
      if (res.data.success) {
        setAppliedCoupon(res.data);
        Alert.alert('Coupon Applied!', `You saved ₹${res.data.discount}`);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid Coupon');
    }
  };

  const handlePurchase = async (pkg) => {
    const finalPrice = appliedCoupon ? Math.max(pkg.priceINR - appliedCoupon.discount, 1) : pkg.priceINR;
    
    Alert.alert(
      'Confirm Purchase',
      `Buy ${pkg.coins} coins for ₹${finalPrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay with Razorpay', 
          onPress: async () => {
            setLoading(true);
            try {
              const res = await api.post('/user/payments/create-razorpay-order', {
                amount: finalPrice,
                currency: 'INR'
              });
              
              const options = {
                description: `Purchase ${pkg.coins} Coins`,
                image: 'https://i.imgur.com/3g7nmJC.png',
                currency: 'INR',
                key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID, 
                amount: res.data.order.amount,
                name: 'ZORA App',
                order_id: res.data.order.id,
                prefill: {
                  email: `${user.phone}@zora.com`,
                  contact: user.phone,
                  name: user.name
                },
                theme: { color: COLORS.primary }
              };

              RazorpayCheckout.open(options).then(async (data) => {
                const verifyRes = await api.post('/user/payments/verify-razorpay', data);
                if (verifyRes.data.success) {
                  Alert.alert('Success', 'Coins added to your wallet!');
                  fetchUserData();
                }
              }).catch((error) => {
                Alert.alert('Error', `Payment failed: ${error.description}`);
              });

            } catch (err) {
              Alert.alert('Purchase Failed', err.response?.data?.message || 'Try again later.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleWithdraw = async () => {
    const amountNum = Number(withdrawAmount);
    if (amountNum * COIN_TO_INR_RATE < 500) return Alert.alert('Error', 'Min withdrawal is ₹500 (5000 Coins).');
    if (!upiId) return Alert.alert('Error', 'Enter UPI ID');
    if (user.coins < amountNum) return Alert.alert('Error', 'Insufficient balance');

    setLoading(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        userId: user._id || user.id,
        amountCoins: amountNum,
        paymentDetails: `UPI: ${upiId}`,
        clientRequestId: `req_${Date.now()}`
      });
      if (res.data.success) {
        Alert.alert('Success', 'Withdrawal request submitted.');
        setWithdrawAmount('');
        fetchUserData();
      }
    } catch (error) {
      Alert.alert('Failed', error.response?.data?.error || 'Exceeded limits.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WALLET</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.balanceCard}>
           <Wallet color="rgba(255,255,255,0.6)" size={40} style={styles.walletIcon} />
           <Text style={styles.balanceLabel}>Current Balance</Text>
           <Text style={styles.coinCount}>{user?.coins || 0}</Text>
           <Text style={styles.inrValue}>≈ ₹{((user?.coins || 0) * COIN_TO_INR_RATE).toFixed(2)}</Text>
        </LinearGradient>

        <TouchableOpacity 
          style={styles.adCard} 
          onPress={() => { setAdLoading(true); showRewardedAd(); }}
          disabled={adLoading}
        >
          <View style={styles.adLeft}>
             <View style={styles.playBox}><Play color={COLORS.textWhite} size={20} fill={COLORS.textWhite} /></View>
             <View>
                <Text style={styles.adTitle}>Free Coins</Text>
                <Text style={styles.adSubtitle}>Watch ad & earn 5 coins</Text>
             </View>
          </View>
          {adLoading ? <ActivityIndicator color={COLORS.accentGlow} /> : <ArrowUpRight color={COLORS.accentGlow} size={24} />}
        </TouchableOpacity>

        {/* Coupon Section */}
        <View style={styles.couponSection}>
           <Text style={styles.sectionTitle}>Apply Coupon</Text>
           <View style={styles.couponInputRow}>
              <View style={{ flex: 1 }}>
                <ZoraInput 
                  placeholder="Enter Code (e.g. ZORA50)" 
                  value={couponCode} 
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity 
                style={[styles.applyBtn, appliedCoupon && styles.appliedBtn]} 
                onPress={handleApplyCoupon}
              >
                {appliedCoupon ? <CheckCircle2 color="#FFF" size={20} /> : <Text style={styles.applyBtnText}>Apply</Text>}
              </TouchableOpacity>
           </View>
           {appliedCoupon && (
             <Text style={styles.couponHint}>Coupon applied! Discount: ₹{appliedCoupon.discount}</Text>
           )}
        </View>

        {/* Coin Store */}
        <View style={styles.storeSection}>
           <Text style={styles.sectionTitle}>Coin Store</Text>
           <View style={styles.packageGrid}>
              {packages.map((pkg) => (
                <TouchableOpacity 
                  key={pkg._id} 
                  style={styles.packageCard}
                  onPress={() => handlePurchase(pkg)}
                >
                   {pkg.bonus > 0 && (
                     <View style={styles.bonusBadge}>
                        <Text style={styles.bonusText}>+{pkg.bonus}</Text>
                     </View>
                   )}
                   <Text style={styles.pkgCoins}>{pkg.coins}</Text>
                   <Text style={styles.pkgLabel}>Coins</Text>
                   <View style={styles.pkgPriceBox}>
                      <Text style={styles.pkgPrice}>₹{pkg.priceINR}</Text>
                   </View>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        {user?.isHost && (
          <View style={styles.withdrawSection}>
             <Text style={styles.sectionTitle}>Withdraw Funds</Text>
             <ZoraInput 
               label="Amount in Coins" 
               placeholder="Min 5000" 
               value={withdrawAmount} 
               onChangeText={setWithdrawAmount} 
               keyboardType="numeric" 
             />
             <ZoraInput 
               label="UPI ID" 
               placeholder="yourname@upi" 
               value={upiId} 
               onChangeText={setUpiId} 
             />
             
             <View style={styles.calcBox}>
                <Text style={styles.calcLabel}>You will receive:</Text>
                <Text style={styles.calcValue}>₹{(Number(withdrawAmount) * COIN_TO_INR_RATE).toFixed(2)}</Text>
             </View>

             <ZoraButton 
               title="Request Withdrawal" 
               onPress={handleWithdraw} 
               loading={loading}
             />
          </View>
        )}

        <View style={styles.rules}>
           <Text style={styles.ruleTitle}>Rules & Limits</Text>
           <View style={styles.ruleItem}><Info size={14} color={COLORS.textGray} /><Text style={styles.ruleText}>Min withdrawal: ₹500 (5000 Coins)</Text></View>
           <View style={styles.ruleItem}><Info size={14} color={COLORS.textGray} /><Text style={styles.ruleText}>Daily Limit: ₹2000</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

import { LinearGradient } from 'expo-linear-gradient';

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
  couponSection: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  couponInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  applyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  appliedBtn: { backgroundColor: COLORS.success },
  applyBtnText: { color: '#FFF', fontWeight: 'bold' },
  couponHint: { color: COLORS.success, fontSize: 12, marginTop: 10, fontWeight: '600' },
  storeSection: { marginBottom: 30 },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  packageCard: { width: '30%', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)', position: 'relative' },
  bonusBadge: { position: 'absolute', top: -8, right: -5, backgroundColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, zIndex: 5 },
  bonusText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  pkgCoins: { color: COLORS.textWhite, fontSize: 18, fontWeight: '900' },
  pkgLabel: { color: COLORS.textGray, fontSize: 10, marginBottom: 10 },
  pkgPriceBox: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pkgPrice: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  withdrawSection: { backgroundColor: COLORS.cardBackground, padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  sectionTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  calcBox: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, marginBottom: 20 },
  calcLabel: { color: COLORS.textGray, fontSize: 14 },
  calcValue: { color: COLORS.success, fontSize: 18, fontWeight: 'bold' },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, justifyContent: 'center' },
  warningText: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
  rules: { marginTop: 30, paddingBottom: 50 },
  ruleTitle: { color: COLORS.textWhite, fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ruleText: { color: COLORS.textGray, fontSize: 12 }
});

export default WalletScreen;
