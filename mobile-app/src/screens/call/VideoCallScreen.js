import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { ShieldAlert, Gift } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import api from '../../services/api';
import socketService from '../../services/socketService';

const VideoCallScreen = ({ route, navigation }) => {
  const { userId, userName, hostId, callId, callRatePerMinute } = route.params;
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [showGiftAnim, setShowGiftAnim] = useState(false);
  const zegoRef = useRef(null);

  useEffect(() => {
    socketService.connect(userId);
    
    socketService.setGiftReceivedHandler((data) => {
      setShowGiftAnim(true);
      setTimeout(() => setShowGiftAnim(false), 4000);
    });

    socketService.setCallTerminatedHandler((data) => {
      Alert.alert('Call Terminated', data.reason || 'This call has been ended by administrator or insufficient balance.');
      handleCallEnd();
    });

    const checkBalance = async () => {
      try {
        const res = await api.get(`/users/${userId}`);
        const coins = res.data.coins;
        setUserCoins(coins);
        
        // If coins are very low (less than 1 minute remaining based on callRatePerMinute)
        if (coins < callRatePerMinute && coins > 0) {
           Alert.alert('Low Balance', 'You have less than 1 minute of call time remaining. Recharge now to continue!');
        }
      } catch (e) {
        console.error('Balance check failed:', e);
      }
    };

    // Rule 1: Initial Start
    api.post(`/calls/start`, { hostId, callId })
      .then(res => {
        if (res.data.success) {
          setIsAllowed(true);
          setUserCoins(res.data.user.coins);
          socketService.notifyCallStarted({ callId, userId, hostId });
          
          // Start balance monitoring every 30s
          const balanceInterval = setInterval(checkBalance, 30000);
          return () => clearInterval(balanceInterval);
        } else {
          Alert.alert('Error', res.data.message || 'Call not allowed');
          navigation.goBack();
        }
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Minimum 30 coins required to start a call';
        Alert.alert('Balance Low', msg);
        navigation.goBack();
      })
      .finally(() => setLoading(false));

    return () => {
      socketService.notifyCallEnded(callId);
      socketService.setCallTerminatedHandler(null);
    };
  }, []);

  const handleCallEnd = async () => {
    socketService.notifyCallEnded(callId);
    navigation.goBack();
  };

  const handleReport = () => {
    // For simplicity, we use a basic Alert here, but real production would have a dedicated Modal
    Alert.alert(
      'Report Performer',
      'Are you sure you want to report this person for violation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report Nudity', 
          onPress: () => submitReport('Nudity/Explicit Content') 
        },
        { 
          text: 'Report Abuse', 
          onPress: () => submitReport('Abusive Behavior') 
        },
      ]
    );
  };

  const submitReport = async (reason) => {
    try {
      await api.post('/reports', { 
        reportedId: hostId, 
        reason 
      });
      Alert.alert('Success', 'Report submitted successfully. Admin will review it.');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  if (loading) return <View style={styles.container} />;
  if (!isAllowed) return null;

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={Number(process.env.EXPO_PUBLIC_ZEGO_APP_ID)}
        appSign={process.env.EXPO_PUBLIC_ZEGO_APP_SIGN}
        userID={userId}
        userName={userName}
        callID={callId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onHangUp: handleCallEnd,
        }}
      />

      {/* Gift Animation Overlay */}
      {showGiftAnim && (
        <View style={styles.lottieOverlay} pointerEvents="none">
           <LottieView 
             source={{ uri: 'https://assets10.lottiefiles.com/packages/lf20_snowfall.json' }} 
             autoPlay 
             loop={false}
             style={styles.fullLottie} 
           />
        </View>
      )}

      {/* Floating Report Button */}
      <TouchableOpacity 
        style={styles.reportButton}
        onPress={handleReport}
      >
        <ShieldAlert color="white" size={20} />
        <Text style={styles.reportText}>Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  reportButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 100,
  },
  reportText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullLottie: {
    width: '100%',
    height: '100%',
  }
});

export default VideoCallScreen;
