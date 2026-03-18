import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Phone, PhoneOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const IncomingCallModal = ({ visible, callerName, onAccept, onReject }) => {
  const soundRef = React.useRef(null);

  async function playRingtone() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/incoming.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
    } catch (e) {
      console.log('Error playing ringtone:', e);
    }
  }

  async function stopRingtone() {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.log('Error stopping ringtone:', e);
    }
  }

  useEffect(() => {
    if (visible) {
      playRingtone();
    } else {
      stopRingtone();
    }
    return () => {
      stopRingtone();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
        <LinearGradient colors={['rgba(159, 103, 255, 0.2)', 'rgba(15,10,25,0.95)']} style={styles.content}>
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=' + (callerName || 'User') + '&background=random&size=200' }} style={styles.avatar} />
                <View style={styles.pulseContainer}>
                   <View style={styles.pulse} />
                </View>
            </View>
            <Text style={styles.incomingText}>INCOMING CALL</Text>
            <Text style={styles.callerName}>{callerName || 'Unknown User'}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => { stopRingtone(); onReject(); }}>
              <PhoneOff color="white" size={32} />
              <Text style={styles.btnLabel}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => { stopRingtone(); onAccept(); }}>
              <Phone color="white" size={32} />
              <Text style={styles.btnLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  content: { height: height * 0.7, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  callerInfo: { alignItems: 'center', marginTop: 40 },
  avatarContainer: { width: 140, height: 140, borderRadius: 70, marginBottom: 30, position: 'relative' },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#A855F7' },
  pulseContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
  pulse: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(168, 85, 247, 0.3)' },
  incomingText: { color: '#A855F7', fontSize: 14, fontWeight: 'bold', letterSpacing: 4, marginBottom: 10 },
  callerName: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 40, marginBottom: 60, width: '100%', justifyContent: 'center' },
  btn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  rejectBtn: { backgroundColor: '#EF4444' },
  acceptBtn: { backgroundColor: '#10B981' },
  btnLabel: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: 10, position: 'absolute', bottom: -30 }
});

export default IncomingCallModal;
