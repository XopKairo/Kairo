import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import api from '../../services/api';
import socketService from '../../services/socketService';

const VideoCallScreen = ({ route, navigation }) => {
  const { userId, userName, hostId, callId, callRatePerMinute } = route.params;
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const zegoRef = useRef(null);

  useEffect(() => {
    socketService.connect(userId);
    
    socketService.setCallTerminatedHandler((data) => {
      Alert.alert('Call Terminated', data.reason || 'Insufficient balance');
      navigation.goBack();
    });

    // RULE 1: Minimum coins required to start a call: 30
    api.post(`/calls/start`, { hostId, callId })
      .then(res => {
        if (res.data.success) {
          setIsAllowed(true);
          socketService.notifyCallStarted({ callId, userId, hostId });
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
      // socketService.disconnect(); // Keep connected for other features if needed
    };
  }, []);

  const handleCallEnd = async () => {
    socketService.notifyCallEnded(callId);
    navigation.goBack();
  };

  if (loading) return <View style={styles.container} />;
  if (!isAllowed) return null;

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={Number(process.env.EXPO_PUBLIC_ZEGO_APP_ID) || 1106955329}
        appSign={process.env.EXPO_PUBLIC_ZEGO_APP_SIGN}
        userID={userId}
        userName={userName}
        callID={callId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onHangUp: handleCallEnd,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});

export default VideoCallScreen;
