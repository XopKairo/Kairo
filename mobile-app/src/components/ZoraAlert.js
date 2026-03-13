import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ZoraAlert = ({ visible, title, message, onClose, type = 'error', confirmText = 'OK', buttons = [] }) => {
  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 color="#10B981" size={40} />,
          colors: ['rgba(16, 185, 129, 0.1)', 'transparent'],
          titleColor: '#10B981',
          btnColor: ['#10B981', '#059669']
        };
      case 'notice':
        return {
          icon: <Info color={COLORS.accentGlow} size={40} />,
          colors: ['rgba(159, 103, 255, 0.1)', 'transparent'],
          titleColor: COLORS.accentGlow,
          btnColor: [COLORS.primary, '#4C1D95']
        };
      case 'error':
      default:
        return {
          icon: <XCircle color="#FF4B4B" size={40} />,
          colors: ['rgba(255, 75, 75, 0.1)', 'transparent'],
          titleColor: '#FF4B4B',
          btnColor: ['#FF4B4B', '#A50000']
        };
    }
  };

  const config = getConfig();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.blurBg} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1A1425', '#0F0A19']} style={styles.alertBox}>
            <LinearGradient colors={config.colors} style={styles.iconContainer}>
              {config.icon}
            </LinearGradient>

            <Text style={[styles.title, { color: config.titleColor }]}>{title.toUpperCase()}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actionsContainer}>
              {buttons.length > 0 ? (
                buttons.map((btn, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.buttonWrapper, { marginBottom: i < buttons.length - 1 ? 10 : 0 }]} 
                    onPress={() => { btn.onPress?.(); onClose(); }}
                  >
                    <LinearGradient 
                      colors={btn.style === 'cancel' ? ['#333', '#111'] : config.btnColor} 
                      style={styles.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.buttonText}>{btn.text.toUpperCase()}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity style={styles.buttonWrapper} onPress={onClose} activeOpacity={0.8}>
                  <LinearGradient 
                    colors={config.btnColor} 
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>{confirmText}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  blurBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.85)' },
  modalContainer: { width: '100%' },
  alertBox: { width: '100%', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 22, marginBottom: 30, fontWeight: '500' },
  actionsContainer: { width: '100%' },
  buttonWrapper: { width: '100%', height: 52, borderRadius: 18, overflow: 'hidden' },
  button: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 }
});

export default ZoraAlert;
