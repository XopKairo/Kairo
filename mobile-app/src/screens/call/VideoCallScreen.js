import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import api from '../../services/api';
import socketService from '../../services/socketService';



const VideoCallScreen = ({ route, navigation }) => {
  const { userId, userName, hostId, callId, callRatePerMinute } = route.params || { 
      userId: 'user_123', userName: 'Test User', hostId: 'host_456', callId: 'call_999', callRatePerMinute: 30 
  };
  const [startTime, setStartTime] = useState(null);

  const appID = 1106955329;
  const appSign = 'f6cb4ea31440995b9b6b724678ff112db1d0220cf0dd31a4057c835faae45bd2';

  useEffect(() => {
    socketService.connect();
    socketService.notifyCallStarted({ userId, hostId, callId, timestamp: new Date() });

    api.post(`/calls/start`, { userId, hostId, callId })
      .then(() => setStartTime(Date.now()))
      .catch(err => console.error("Error starting call log:", err));

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleCallEnd = async () => {
    if (!startTime) return navigation.goBack();

    const endTime = Date.now();
    const durationInMinutes = Math.max(1, Math.ceil((endTime - startTime) / 60000)); 

    try {
      const response = await api.post(`/calls/end`, {
        callId,
        durationInMinutes,
        callRatePerMinute: callRatePerMinute || 30 
      });

      const { transaction } = response.data;
      Alert.alert(
        'Call Ended', 
        `Duration: ${durationInMinutes} mins
Coins Deducted: ${transaction.totalCoinsDeducted}`
      );
    } catch (error) {
      console.error("Error ending call transaction:", error);
      Alert.alert('Error', 'Could not process call transaction.');
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={appID}
        appSign={appSign}
        userID={userId}
        userName={userName}
        callID={callId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onHangUp: handleCallEnd,
          onHangUpConfirmation: () => {
             return new Promise((resolve) => resolve());
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default VideoCallScreen;
