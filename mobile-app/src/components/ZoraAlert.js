import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';

const ZoraAlert = ({ visible, title, message, onClose, type = 'error' }) => {
  if (!visible) return null;

  const getTitleColor = () => {
    switch (type) {
      case 'error': return COLORS.error;
      case 'success': return COLORS.success;
      case 'notice': return COLORS.accentGlow;
      default: return COLORS.textWhite;
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.alertBox}>
            <Text style={[styles.title, { color: getTitleColor() }]}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  alertBox: {
    width: '100%',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.2)',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: 'rgba(108, 43, 217, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ZoraAlert;
