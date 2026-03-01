import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollValue, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, TextInput, Divider, List, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const COIN_TO_INR_RATE = 0.1; // Matches backend: 100 Coins = 10 INR

const WalletScreen = () => {
  const [user, setUser] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const response = await api.get(`/users/${parsedUser._id}`);
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user for wallet:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) < 100) {
      return Alert.alert('Invalid Amount', 'Minimum withdrawal is 100 coins.');
    }
    if (!paymentDetails) {
      return Alert.alert('Missing Details', 'Please provide UPI ID or Bank Details.');
    }
    if (user.coins < Number(withdrawAmount)) {
      return Alert.alert('Insufficient Balance', 'You do not have enough coins.');
    }

    setLoading(true);
    try {
      const response = await api.post('/wallet/withdraw', {
        userId: user._id,
        amountCoins: Number(withdrawAmount),
        paymentDetails
      });

      if (response.data.success) {
        Alert.alert('Request Submitted', `Your withdrawal of ₹${response.data.amountINR} is pending approval.`);
        setWithdrawAmount('');
        setPaymentDetails('');
        fetchUserData(); // Refresh balance
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit withdrawal request.');
    } finally {
      setLoading(false);
    }
  };

  const calculatedINR = (Number(withdrawAmount) * COIN_TO_INR_RATE).toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.balanceCard}>
        <Card.Content style={styles.balanceContent}>
          <Title style={styles.balanceTitle}>My Coins</Title>
          <Text style={styles.coinCount}>{user?.coins || 0}</Text>
          <Paragraph style={styles.approxValue}>≈ ₹{( (user?.coins || 0) * COIN_TO_INR_RATE ).toFixed(2)}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.withdrawCard}>
        <Card.Title title="Withdraw Earnings" subtitle="Convert Coins to Real Money" />
        <Card.Content>
          <TextInput
            label="Coins to Withdraw (Min 100)"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          
          <View style={styles.conversionBox}>
             <Text>You will receive: </Text>
             <Text style={styles.inrAmount}>₹{calculatedINR}</Text>
          </View>

          <TextInput
            label="UPI ID / Bank Account Details"
            value={paymentDetails}
            onChangeText={setPaymentDetails}
            placeholder="e.g. user@upi or Account No, IFSC"
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Button 
            mode="contained" 
            onPress={handleWithdraw} 
            loading={loading}
            disabled={loading}
            style={styles.withdrawBtn}
            contentStyle={{ height: 50 }}
          >
            Submit Withdrawal Request
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.infoSection}>
        <Title style={styles.infoTitle}>Important Info</Title>
        <List.Item
          title="Conversion Rate"
          description="10 Coins = 1 INR"
          left={props => <List.Icon {...props} icon="information-outline" />}
        />
        <List.Item
          title="Processing Time"
          description="Withdrawals are processed within 24-48 hours."
          left={props => <List.Icon {...props} icon="clock-outline" />}
        />
        <List.Item
          title="Min Withdrawal"
          description="Minimum 100 coins required to request."
          left={props => <List.Icon {...props} icon="alert-circle-outline" />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#8A2BE2',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 4,
  },
  balanceContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  balanceTitle: {
    color: '#fff',
    fontSize: 18,
  },
  coinCount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  approxValue: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  withdrawCard: {
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  conversionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  inrAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  withdrawBtn: {
    marginTop: 10,
    backgroundColor: '#8A2BE2',
  },
  infoSection: {
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 10,
  }
});

export default WalletScreen;
