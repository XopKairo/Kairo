import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { ShieldAlert } from 'lucide-react-native';
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
      Alert.alert('Call Terminated', data.reason || 'This call has been ended by administrator or insufficient balance.');
      handleCallEnd();
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
  }
});

export default VideoCallScreen;
