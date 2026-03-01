import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
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
      // Force 2.5 seconds delay to show the splash screen as requested
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      try {
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
      colors={['#e0f7fa', '#d8bfd8', '#dda0dd']} // Light blue + purple gradient
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
    color: '#4B0082',
    letterSpacing: 2,
    marginBottom: 10,
  },
  quote: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    fontWeight: '500',
  }
});

export default ZoraSplashScreen;