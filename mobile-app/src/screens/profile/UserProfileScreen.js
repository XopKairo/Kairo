import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Button, Card, Title, Paragraph, List } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const UserProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const response = await api.get(`/users/${parsedUser._id}`);
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
          source={{ uri: user?.profilePicture || 'https://i.pravatar.cc/300' }} 
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
        <Card.Actions>
          <Button 
            mode="contained" 
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Wallet')}
          >
            Manage Wallet & Withdraw
          </Button>
        </Card.Actions>
      </Card>

      <List.Section style={styles.listSection}>
        <List.Item
          title="Account Settings"
          left={props => <List.Icon {...props} icon="cog" />}
          onPress={() => navigation.navigate('Settings')}
        />
        <List.Item
          title="Verification Status"
          description={user?.isVerified ? 'Verified Account' : 'Pending Verification'}
          left={props => <List.Icon {...props} icon="check-decagram" color={user?.isVerified ? '#4caf50' : '#ffa000'} />}
          onPress={() => navigation.navigate('Verification')}
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
