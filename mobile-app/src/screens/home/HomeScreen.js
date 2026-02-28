import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Welcome to Zora</Text>
      <Text variant="bodyLarge" style={{ marginVertical: 20 }}>Find hosts and start calling!</Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('VideoCall', {
            userId: 'user_123',
            userName: 'John Doe',
            hostId: 'host_456',
            callId: 'call_' + Math.floor(Math.random() * 10000),
            callRatePerMinute: 30
        })}
      >
        Start a Video Call
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default HomeScreen;
