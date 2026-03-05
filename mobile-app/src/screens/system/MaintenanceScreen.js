import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Construction } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';

const MaintenanceScreen = ({ onRefresh }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Construction size={80} color={COLORS.primary} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>System Maintenance</Text>
        <Text style={styles.subtitle}>
          We are currently performing scheduled maintenance to improve our services. 
          We'll be back online shortly!
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Our team is working hard to bring you a better experience. Thank you for your patience.
          </Text>
        </View>

        <Button 
          mode="contained" 
          onPress={onRefresh || (() => {})} 
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Check Again
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(159, 103, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.textWhite,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.textGray,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
    marginBottom: SPACING.xl,
  },
  cardText: {
    color: COLORS.textGray,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 15,
    width: '100%',
    backgroundColor: COLORS.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  }
});

export default MaintenanceScreen;
