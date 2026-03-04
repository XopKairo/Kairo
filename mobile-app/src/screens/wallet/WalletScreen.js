import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Text, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { initRewardedAd, showRewardedAd } from '../../services/adService';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';
import { Wallet, Play, ArrowUpRight, History, ShieldInfo, Info } from 'lucide-react-native';

const COIN_TO_INR_RATE = 0.1;

const WalletScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentType, setPaymentType] = useState('upi'); 
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
    const cleanupAds = initRewardedAd(
      () => setAdLoading(false),
      async (rewardAmount) => {
        try {
          const res = await api.post('/wallet/earn-ad', { userId: user?._id || user?.id });
          if (res.data.success) {
            Alert.alert('Reward Earned!', `You received ${rewardAmount} coins.`);
            fetchUserData();
          }
        } catch (err) {}
      }
    );
    return () => { if (typeof cleanupAds === 'function') cleanupAds(); };
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(storedUser || '{}');
      const response = await api.get(`/users/${parsedUser.id || parsedUser._id}`);
      setUser(response.data);
      if (response.data.paymentMethods?.upiId) setUpiId(response.data.paymentMethods.upiId);
    } catch (error) {}
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
             disabled={user?.gender === 'Male' || !user?.isGenderVerified}
           />
           
           {user?.gender === 'Male' && (
             <View style={styles.warningBox}>
                <ShieldInfo color={COLORS.error} size={16} />
                <Text style={styles.warningText}>Withdrawal is for Female Hosts only.</Text>
             </View>
           )}
        </View>

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
