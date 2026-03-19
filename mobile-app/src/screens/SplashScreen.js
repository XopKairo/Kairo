import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { COLORS } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../services/pushService';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let mounted = true;
    async function setupUI() {
      if (Platform.OS === 'android') {
        setTimeout(async () => {
          if (mounted) {
            try {
              await NavigationBar.setVisibilityAsync('hidden');
              await NavigationBar.setBehaviorAsync('inset-touch');
              await SystemUI.setBackgroundColorAsync('transparent');
            } catch (e) {
              console.warn('Splash UI setup failed:', e);
            }
          }
        }, 100);
      }
    }
    setupUI();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const checkTokenAndNavigate = async () => {
      try {
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));
        await minDelay;
        
        const token = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');

        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          registerForPushNotificationsAsync(userData.id || userData._id);
          navigation.replace('Main');
        } else if (hasOnboarded) {
          navigation.replace('Login');
        } else {
          navigation.replace('Onboarding');
        }
      } catch (e) {
        navigation.replace('Login');
      }
    };
    
    checkTokenAndNavigate();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.logo}>ZORA</Text>
        <View style={styles.glow} />
        <Text style={styles.quote}>Where connections blossom</Text>
        <Text style={styles.creator}>by Ajil M</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: 10,
    zIndex: 2,
  },
  quote: {
    fontSize: 14,
    color: COLORS.accentGlow,
    marginTop: 10,
    letterSpacing: 2,
    fontWeight: '500',
    opacity: 0.8,
  },
  creator: {
    fontSize: 10,
    color: COLORS.textGray,
    marginTop: 40,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
    opacity: 0.4,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: COLORS.primary,
    borderRadius: 60,
    top: '40%',
    opacity: 0.4,
    shadowColor: COLORS.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 25,
  },
});

export default SplashScreen;
