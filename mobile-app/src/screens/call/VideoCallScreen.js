import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { ShieldAlert, Gift, ShieldCheck, Lock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
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
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
          showAlert('Permissions Required', 'Camera and Microphone access are needed for video calls.', 'error');
          navigation.goBack();
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Permission error:', err);
        return true; // Proceed anyway, let Zego handle if it can
      }
    };

    const startCall = async () => {
      try {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          if (isMounted) setLoading(false);
          return;
        }

        if (!isIncoming) {
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
        }
      } catch (err) {
        console.error('startCall Error:', err);
        if (isMounted && !isIncoming) {
          const msg = err.response?.data?.message || 'Failed to start call. Check connection.';
          showAlert('Call Error', msg, 'error');
          navigation.goBack();
        }
      } finally {
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

  if (loading) {
    return (
      <LinearGradient colors={['#0F0A19', '#1a1a2e', '#000']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.loadingWrapper}>
          <View style={styles.iconCircle}>
             <ShieldCheck color="#A855F7" size={48} strokeWidth={1.5} />
             <View style={styles.pulseInner} />
          </View>
          
          <ActivityIndicator size="large" color="#A855F7" style={{ marginTop: 30 }} />
          
          <Text style={styles.loadingTitle}>ZORA SECURE CONNECT</Text>
          <View style={styles.encryptionBadge}>
             <Lock color="#6B7280" size={12} />
             <Text style={styles.encryptionText}>END-TO-END ENCRYPTED</Text>
          </View>
          
          <Text style={styles.loadingSub}>Connecting to {userName || 'Performer'}...</Text>
        </View>
        
        <View style={styles.loadingFooter}>
           <Text style={styles.footerText}>KAIRO SECURE PROTOCOL V3.0</Text>
        </View>
      </LinearGradient>
    );
  }
  if (!isAllowed) return null;

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={parseInt(process.env.EXPO_PUBLIC_ZEGO_APP_ID || "1106955329")}
        appSign={process.env.EXPO_PUBLIC_ZEGO_APP_SIGN || "f6cb4ea31440995b9b6b724678ff112db1d0220cf0dd31a4057c835faae45bd2"}
        userID={String(userId)}
        userName={String(userName || 'User')}
        callID={String(callId)}
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
  loadingWrapper: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(168, 85, 247, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)' },
  pulseInner: { ...StyleSheet.absoluteFillObject, borderRadius: 50, borderWidth: 2, borderColor: '#A855F7', opacity: 0.2 },
  loadingTitle: { color: '#FFF', marginTop: 25, fontSize: 18, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  encryptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, marginTop: 15 },
  encryptionText: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  loadingSub: { color: 'rgba(255,255,255,0.4)', marginTop: 20, fontSize: 13, fontWeight: '500' },
  loadingFooter: { position: 'absolute', bottom: 50, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  reportButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255, 0, 0, 0.4)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5, zIndex: 100 },
  reportText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  closeButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, zIndex: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  closeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  lottieOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  fullLottie: { width: '100%', height: '100%' }
});

export default VideoCallScreen;