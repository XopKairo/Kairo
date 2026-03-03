import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NetworkBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [animation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      // Animate banner based on connection status
      Animated.timing(animation, {
        toValue: state.isConnected ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0], // Hide off-screen when connected
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={[
      styles.banner, 
      { 
        transform: [{ translateY }], 
        opacity,
        paddingTop: Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || 0) + 10
      }
    ]}>
      <Text style={styles.text}>No Internet Connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it's above everything
    elevation: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NetworkBanner;
