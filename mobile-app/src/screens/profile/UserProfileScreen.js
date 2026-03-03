import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Button, Card, Title, Paragraph, List } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const UserProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  const fetchUserData = async () => {
    try {
      const storedUserStr = await AsyncStorage.getItem('userData');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        const response = await api.get(`/users/${storedUser._id || storedUser.id}`);
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image 
          size={100} 
          source={user?.profilePicture ? { uri: user.profilePicture } : require('../../../assets/icon.png')} 
        />
        <Title style={styles.name}>{user?.name || 'Loading...'}</Title>
        <Paragraph style={styles.email}>{user?.email || user?.phone || ''}</Paragraph>
      </View>

      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <View style={styles.walletHeader}>
            <Title>My Wallet</Title>
            <Text style={styles.coinText}>{user?.coins || 0} Coins</Text>
          </View>
          <Paragraph style={styles.conversionInfo}>10 Coins = 1 INR</Paragraph>
        </Card.Content>
        <Card.Actions style={{ flexDirection: 'column', gap: 10 }}>
          <Button 
            mode="contained" 
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Wallet')}
          >
            Manage Wallet & Withdraw
          </Button>
          {(!user?.gender || (user?.gender === 'Female' && !user?.isGenderVerified)) && (
            <Button 
              mode="outlined" 
              style={[styles.walletBtn, { borderColor: '#8A2BE2' }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              Complete Profile / Verify
            </Button>
          )}
        </Card.Actions>
      </Card>

      <List.Section style={styles.listSection}>
        <List.Item
          title="Account Settings"
          left={props => <List.Icon {...props} icon="cog" />}
          onPress={() => navigation.navigate('EditProfile')}
        />
        <List.Item
          title="Account Status"
          description={user?.isGenderVerified ? 'Gender Verified Host' : (user?.gender === 'Female' ? 'Gender Verification Pending' : 'Standard User')}
          left={props => <List.Icon {...props} icon={user?.isGenderVerified ? 'shield-check' : 'shield-alert'} color={user?.isGenderVerified ? '#4caf50' : '#ffa000'} />}
        />
        <List.Item
          title="Withdrawal Eligibility"
          description={user?.gender === 'Male' ? 'Not Eligible (Female Hosts Only)' : (user?.isGenderVerified ? 'Eligible' : 'Verify Gender to Unlock')}
          left={props => <List.Icon {...props} icon="cash-multiple" color={user?.isGenderVerified ? '#4caf50' : '#ffa000'} />}
        />
        <List.Item
          title="My Interests"
          left={props => <List.Icon {...props} icon="heart" />}
          onPress={() => navigation.navigate('SelectInterests')}
        />
      </List.Section>

      <Button 
        mode="outlined" 
        style={styles.logoutBtn} 
        onPress={async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
    marginBottom: 20,
  },
  name: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    color: 'gray',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 15,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  conversionInfo: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
  },
  walletBtn: {
    width: '100%',
    backgroundColor: '#8A2BE2',
  },
  listSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  logoutBtn: {
    margin: 16,
    borderColor: '#ff5252',
    textColor: '#ff5252',
  },
});

export default UserProfileScreen;
