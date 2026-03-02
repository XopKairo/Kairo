import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Alert } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../../services/pushService';

const ZoraSplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const checkTokenAndNavigate = async () => {
      try {
        // Force exactly 1000ms delay while checking settings
        const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
        const settingsReq = axios.get('https://kairo-b1i9.onrender.com/api/settings', { timeout: 3000 }).catch(() => null);
        
        const [_, settingsRes] = await Promise.all([minDelay, settingsReq]);

        if (settingsRes && settingsRes.data && settingsRes.data.maintenance) {
          Alert.alert(
            "System Maintenance",
            "Zora is currently undergoing scheduled maintenance. Please try again later.",
            [{ text: "OK" }]
          );
          return;
        }
        
        const token = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          registerForPushNotificationsAsync(userData.id || userData._id);
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      } catch (e) {
        navigation.replace('Login');
      }
    };
    
    checkTokenAndNavigate();
  }, [fadeAnim, navigation]);

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']} // Dark mode gradient
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Zora</Text>
        <Text style={styles.quote}>"Where connections blossom"</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 25,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 10,
  },
  quote: {
    fontSize: 16,
    color: '#A29BFE',
    fontStyle: 'italic',
    fontWeight: '500',
  }
});

export default ZoraSplashScreen;