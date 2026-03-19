import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { ShieldAlert, Gift } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import api from '../../services/api';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const VideoCallScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userId, userName, hostId, callId, callRatePerMinute, isIncoming } = route.params;
  const { showAlert } = useAuth();
  const [isAllowed, setIsAllowed] = useState(isIncoming);
  const [loading, setLoading] = useState(!isIncoming);
  const [userCoins, setUserCoins] = useState(0);
  const [showGiftAnim, setShowGiftAnim] = useState(false);
  const ringtoneSoundRef = useRef(null);

  const playRingtone = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/outgoing.mp3'), 
        { shouldPlay: true, isLooping: true }
      );
      ringtoneSoundRef.current = sound;
    } catch (e) {
      console.log('Error playing ringtone:', e);
    }
  };

  const stopRingtone = async () => {
    try {
      if (ringtoneSoundRef.current) {
        await ringtoneSoundRef.current.stopAsync();
        await ringtoneSoundRef.current.unloadAsync();
        ringtoneSoundRef.current = null;
      }
    } catch (e) {
      console.log('Error stopping ringtone:', e);
    }
  };

  useEffect(() => {
    socketService.connect(userId);
    let balanceInterval = null;
    let isMounted = true;
    
    socketService.setGiftReceivedHandler((data) => {
      if (isMounted) {
        setShowGiftAnim(true);
        setTimeout(() => { if(isMounted) setShowGiftAnim(false); }, 4000);
      }
    });

    socketService.setCallEndedHandler((data) => {
      stopRingtone();
      if (data.totalCost) {
        showAlert('Call Ended', `Duration: ${data.durationMinutes} min\nCost: ${data.totalCost} coins`, 'notice');
      }
      handleCallEnd();
    });

    socketService.setCallActiveHandler(() => {
      stopRingtone();
    });

    socketService.setForceDisconnectHandler(() => {
      stopRingtone();
      showAlert('Call Terminated', 'Call ended due to low balance.', 'notice');
      handleCallEnd();
    });

    const checkBalance = async () => {
      try {
        const res = await api.get(`user/users/${userId}`);
        const coins = res.data.coins;
        if (isMounted) {
          setUserCoins(coins);
          if (coins < callRatePerMinute && coins > 0) {
             showAlert('Low Balance', 'You have less than 1 minute remaining. Recharge now!', 'notice', 'RECHARGE');
          }
        }
      } catch (e) {
        console.error('Balance check failed:', e);
      }
    };

    const requestPermissions = async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
        showAlert('Permissions Required', 'Camera and Microphone access are needed for video calls.', 'error');
        navigation.goBack();
        return false;
      }
      return true;
    };

    const startCall = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      if (!isIncoming) {
        try {
          const res = await api.post(`user/calls/start`, { hostId, callId });
          if (res.data.success && isMounted) {
            setIsAllowed(true);
            setUserCoins(res.data.user.coins);
            socketService.notifyCallStarted({ callId, userId, hostId, userName });
            
            playRingtone();
            
            balanceInterval = setInterval(checkBalance, 30000);
          } else if (isMounted) {
            showAlert('Error', res.data.message || 'Call not allowed', 'error');
            navigation.goBack();
          }
        } catch (err) {
          if (isMounted) {
            const msg = err.response?.data?.message || 'Minimum coins required to start a call';
            showAlert('Insufficient Balance', msg, 'error', 'GET COINS');
            navigation.goBack();
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) setLoading(false);
      }
    };

    startCall();

    return () => {
      isMounted = false;
      stopRingtone();
      if (balanceInterval) clearInterval(balanceInterval);
      socketService.notifyCallEnded(callId);
      socketService.setCallEndedHandler(() => {});
      socketService.setForceDisconnectHandler(() => {});
      socketService.setGiftReceivedHandler(() => {});
      socketService.setCallActiveHandler(() => {});
    };
  }, []);

  const handleCallEnd = async () => {
    stopRingtone();
    try {
      socketService.notifyCallEnded(callId);
      
      // Force navigation after a short delay to ensure Zego cleanup doesn't block UI
      setTimeout(() => {
        if (!isIncoming) {
          // Caller side: Go to Host Profile with "justFinishedCall" trigger for the Pro Popup
          navigation.replace('HostProfile', { hostId, justFinishedCall: true });
        } else {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          }
        }
      }, 500);
    } catch (e) {
      navigation.navigate('Main');
    }
  };

  const handleReport = () => {
    showAlert(
      'Report Performer',
      'Select a reason for reporting violation.',
      'error',
      'CANCEL',
      [
        { text: 'Nudity Content', onPress: () => submitReport('Nudity/Explicit Content') },
        { text: 'Abusive Behavior', onPress: () => submitReport('Abusive Behavior') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const submitReport = async (reason) => {
    try {
      await api.post('user/reports', { reportedId: hostId, reason });
      showAlert('Success', 'Report submitted. Admin will review.', 'success');
    } catch (e) {
      showAlert('Error', 'Failed to submit report', 'error');
    }
  };

  if (loading) return <View style={styles.container} />;
  if (!isAllowed) return null;

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={parseInt(process.env.EXPO_PUBLIC_ZEGO_APP_ID || 0)}
        appSign={process.env.EXPO_PUBLIC_ZEGO_APP_SIGN || ''}
        userID={userId}
        userName={userName}
        callID={callId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onHangUp: () => {
             handleCallEnd();
          },
          onCallEnd: (callID, reason, duration) => {
             handleCallEnd();
          },
          onOnlySelfInRoom: () => {
             console.log("Only self in room");
          },
          notifyInviteeWhenInvitationTimeout: true,
          audioVideoViewConfig: {
             showCameraStateOnView: false,
             showMicrophoneStateOnView: false,
             showUserNameOnView: false,
          },
          bottomMenuBarConfig: {
             buttons: [
                0, // toggle microphone
                1, // toggle camera
                2, // switch camera
                3, // hang up
                4, // beauty effect
             ]
          },
          layout: {
             mode: 0, // 0 is Picture-in-Picture
          }
        }}
      />

      {showGiftAnim && (
        <View style={styles.lottieOverlay} pointerEvents="none">
           <LottieView source={{ uri: 'https://assets10.lottiefiles.com/packages/lf20_snowfall.json' }} autoPlay loop={false} style={styles.fullLottie} />
        </View>
      )}

      <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
        <ShieldAlert color="white" size={20} />
        <Text style={styles.reportText}>Report</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={handleCallEnd}>
        <Text style={styles.closeText}>EXIT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  reportButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255, 0, 0, 0.4)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5, zIndex: 100 },
  reportText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  closeButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, zIndex: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  closeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  lottieOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  fullLottie: { width: '100%', height: '100%' }
});

export default VideoCallScreen;