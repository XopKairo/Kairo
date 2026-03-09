import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import { sendOtp } from '../../services/api';

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGetOTP = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    if (mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!isTermsAccepted) {
      Alert.alert('Terms and Conditions', 'Please accept the Terms and Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
        const formattedContact = `+91${mobileNumber}`;
        const res = await sendOtp(formattedContact);
        if(res.success) {
            navigation.navigate('OTP', { mobileNumber: formattedContact });
        }
    } catch(err) {
        Alert.alert("Error", err.message || "Failed to send OTP");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>ZORA</Text>
            <Text style={styles.subtitle}>Welcome back to the elite circle</Text>
          </View>

          <View style={styles.formCard}>
            
            {/* Input Box with Neon Border */}
            <View style={[styles.inputWrapper, isFocused && styles.neonBorder]}>
              <View style={styles.prefixContainer}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.prefix}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor={COLORS.textGray}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                maxLength={10}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            {/* Terms and Conditions Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setIsTermsAccepted(!isTermsAccepted)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked]}>
                {isTermsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </TouchableOpacity>

            <ZoraButton
              title="Get OTP"
              onPress={handleGetOTP}
              loading={loading}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: 6,
  },
  subtitle: {
    color: COLORS.textGray,
    fontSize: 16,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 60,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  neonBorder: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    paddingRight: 10,
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  prefix: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: COLORS.textWhite,
    fontSize: 16,
    height: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.textGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    color: COLORS.textGray,
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: COLORS.accentGlow,
    fontWeight: '600',
  },
});

export default LoginScreen;
