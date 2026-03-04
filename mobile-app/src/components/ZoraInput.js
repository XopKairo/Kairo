import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/theme';

const ZoraInput = ({ label, error, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.errorBorder]}>
        <TextInput
          placeholderTextColor="#6B7280"
          style={styles.input}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textGray,
    fontSize: 14,
    marginBottom: SPACING.xs,
    fontWeight: '500',
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
    height: 56,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  input: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default ZoraInput;
