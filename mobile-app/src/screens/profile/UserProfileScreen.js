import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Card, Title, Paragraph } from 'react-native-paper';

const UserProfileScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image 
          size={100} 
          source={{ uri: 'https://i.pravatar.cc/300' }} 
        />
        <Title style={styles.name}>John Doe</Title>
        <Paragraph style={styles.email}>john.doe@example.com</Paragraph>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Wallet</Title>
          <Paragraph>Balance: 1,500 Coins</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => console.log('Recharge')}>Recharge</Button>
        </Card.Actions>
      </Card>

      <Button 
        mode="outlined" 
        style={styles.settingsBtn} 
        onPress={() => navigation.navigate('Settings')}
      >
        Settings
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
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
    marginBottom: 20,
  },
  settingsBtn: {
    marginTop: 'auto',
  }
});

export default UserProfileScreen;
