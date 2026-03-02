import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, TextInput, List, Title, Paragraph, Divider, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { initRewardedAd, showRewardedAd } from '../../services/adService';

const COIN_TO_INR_RATE = 0.1;

const WalletScreen = () => {
  const [user, setUser] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentType, setPaymentType] = useState('upi'); // 'upi' or 'bank'
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountHolder: '', accountNumber: '', ifscCode: '', bankName: '' });
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(storedUser || '{}');
      const response = await api.get(`/users/${parsedUser.id || parsedUser._id}`);
      setUser(response.data);
      
      if (response.data.paymentMethods) {
        if (response.data.paymentMethods.upiId) setUpiId(response.data.paymentMethods.upiId);
        if (response.data.paymentMethods.bankDetails) setBankDetails(response.data.paymentMethods.bankDetails);
      }
    } catch (error) {
      console.error('Error fetching user for wallet:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    // Initialize Rewarded Ads
    const cleanupAds = initRewardedAd(
      () => setAdLoading(false), // On Dismiss
      async (rewardAmount) => {  // On Reward Earned
        try {
          const res = await api.post('/wallet/earn-ad', { userId: user?._id || user?.id });
          if (res.data.success) {
            Alert.alert('Reward Earned!', `You received ${rewardAmount} coins.`);
            fetchUserData();
          }
        } catch (err) {
          console.error('Failed to credit ad reward');
        }
      }
    );

    return () => {
      if (typeof cleanupAds === 'function') cleanupAds();
    };
  }, []);

  const handleWatchAd = () => {
    setAdLoading(true);
    showRewardedAd();
    // Fallback if ad fails to show
    setTimeout(() => setAdLoading(false), 5000);
  };

  const handleWithdraw = async () => {
    const amountNum = Number(withdrawAmount);
    if (!withdrawAmount || amountNum * COIN_TO_INR_RATE < 500) {
      return Alert.alert('Invalid Amount', 'Minimum withdrawal is ₹500 (5000 Coins).');
    }
    
    let paymentStr = '';
    if (paymentType === 'upi') {
      if (!upiId) return Alert.alert('Error', 'Please enter UPI ID');
      paymentStr = `UPI: ${upiId}`;
    } else {
      if (!bankDetails.accountNumber || !bankDetails.ifscCode) return Alert.alert('Error', 'Please fill bank details');
      paymentStr = `Bank: ${bankDetails.bankName}, A/C: ${bankDetails.accountNumber}, IFSC: ${bankDetails.ifscCode}`;
    }

    if (user.coins < amountNum) {
      return Alert.alert('Insufficient Balance', 'You do not have enough coins.');
    }

    setLoading(true);
    try {
      const response = await api.post('/wallet/withdraw', {
        userId: user._id || user.id,
        amountCoins: amountNum,
        paymentDetails: paymentStr
      });

      if (response.data.success) {
        Alert.alert('Request Submitted', `Your withdrawal of ₹${response.data.amountINR} is pending approval.`);
        setWithdrawAmount('');
        fetchUserData();
      }
    } catch (error) {
      Alert.alert('Withdrawal Failed', error.response?.data?.error || 'Exceeded limits or server error.');
    } finally {
      setLoading(false);
    }
  };

  const calculatedINR = (Number(withdrawAmount) * COIN_TO_INR_RATE).toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.balanceCard}>
        <Card.Content style={styles.balanceContent}>
          <Title style={styles.balanceTitle}>My Balance</Title>
          <Text style={styles.coinCount}>{user?.coins || 0} Coins</Text>
          <Paragraph style={styles.approxValue}>≈ ₹{( (user?.coins || 0) * COIN_TO_INR_RATE ).toFixed(2)}</Paragraph>
        </Card.Content>
      </Card>

      {/* Ad Reward Section */}
      <Card style={styles.adCard}>
        <Card.Content className="d-flex align-center justify-space-between">
          <View style={{flex: 1}}>
            <Title style={{fontSize: 18}}>Earn Free Coins</Title>
            <Paragraph style={{fontSize: 12}}>Watch a short video ad to get 5 coins!</Paragraph>
          </View>
          <Button mode="contained" onPress={handleWatchAd} loading={adLoading} color="#FFD700" labelStyle={{color: '#000', fontWeight: 'bold'}}>
            Watch Ad
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.withdrawCard}>
        <Card.Title title="Cash Out" subtitle="Convert earnings to your account" />
        <Card.Content>
          <TextInput
            label="Coins to Withdraw"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="numeric"
            mode="outlined"
            placeholder="Min 5000 Coins (₹500)"
            style={styles.input}
          />
          <View style={styles.conversionBox}>
             <Text style={{fontWeight: 'bold'}}>Receive Amount: </Text>
             <Text style={styles.inrAmount}>₹{calculatedINR}</Text>
          </View>

          <Divider style={styles.divider} />
          <Text style={styles.sectionLabel}>Withdrawal Method</Text>
          
          <View style={styles.typeContainer}>
            <TouchableOpacity style={[styles.typeBtn, paymentType === 'upi' && styles.activeType]} onPress={() => setPaymentType('upi')}>
              <Text style={paymentType === 'upi' ? styles.activeTypeText : {}}>UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, paymentType === 'bank' && styles.activeType]} onPress={() => setPaymentType('bank')}>
              <Text style={paymentType === 'bank' ? styles.activeTypeText : {}}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>

          {paymentType === 'upi' ? (
            <TextInput
              label="UPI ID"
              value={upiId}
              onChangeText={setUpiId}
              placeholder="example@upi"
              mode="outlined"
              style={styles.input}
            />
          ) : (
            <View>
              <TextInput label="Bank Name" value={bankDetails.bankName} onChangeText={v => setBankDetails({...bankDetails, bankName: v})} mode="outlined" style={styles.smallInput} />
              <TextInput label="Account Holder" value={bankDetails.accountHolder} onChangeText={v => setBankDetails({...bankDetails, accountHolder: v})} mode="outlined" style={styles.smallInput} />
              <TextInput label="Account Number" value={bankDetails.accountNumber} onChangeText={v => setBankDetails({...bankDetails, accountNumber: v})} mode="outlined" style={styles.smallInput} />
              <TextInput label="IFSC Code" value={bankDetails.ifscCode} onChangeText={v => setBankDetails({...bankDetails, ifscCode: v})} mode="outlined" style={styles.smallInput} />
            </View>
          )}

          <Button 
            mode="contained" 
            onPress={handleWithdraw} 
            loading={loading} 
            style={styles.withdrawBtn} 
            disabled={user?.gender === 'Male' || !user?.isGenderVerified}
          >
            {user?.gender === 'Male' 
              ? 'Withdrawal Disabled' 
              : (!user?.isGenderVerified ? 'Verification Pending' : 'Withdraw Now')}
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.limitInfo}>
        <Title style={{fontSize: 16}}>Withdrawal Rules & Limits</Title>
        <List.Item title="Minimum Payout" description="₹500 (5000 Coins)" left={p => <List.Icon {...p} icon="minus-circle-outline" />} />
        <List.Item title="Male Users" description="Withdrawal is DISABLED for Male users." titleStyle={{color: 'red'}} left={p => <List.Icon {...p} icon="block-helper" color="red" />} />
        <List.Item title="Female Hosts" description="No monthly limit. Verified hosts only." left={p => <List.Icon {...p} icon="star-face" color="#e91e63" />} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  balanceCard: { backgroundColor: '#8A2BE2', borderRadius: 20, marginBottom: 15, elevation: 6 },
  balanceContent: { alignItems: 'center', paddingVertical: 25 },
  balanceTitle: { color: '#fff', fontSize: 16, opacity: 0.9 },
  coinCount: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  approxValue: { color: '#fff', fontSize: 18, opacity: 0.8 },
  adCard: { borderRadius: 15, marginBottom: 15, backgroundColor: '#fff', elevation: 2 },
  withdrawCard: { borderRadius: 15, paddingVertical: 10, marginBottom: 20 },
  input: { marginBottom: 15 },
  smallInput: { marginBottom: 10 },
  conversionBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f1f8e9', padding: 15, borderRadius: 10, marginBottom: 15 },
  inrAmount: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  divider: { marginVertical: 15 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#666' },
  typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  activeType: { borderColor: '#8A2BE2', backgroundColor: '#f3e5f5' },
  activeTypeText: { color: '#8A2BE2', fontWeight: 'bold' },
  withdrawBtn: { marginTop: 10, backgroundColor: '#8A2BE2', paddingVertical: 5 },
  limitInfo: { paddingBottom: 40 }
});

export default WalletScreen;
