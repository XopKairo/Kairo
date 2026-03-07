import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';
import { useAuth } from '../../context/AuthContext';
import { sendOtp, resetPassword, verifyOtp } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/pushService';

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [fpModalVisible, setFpModalVisible] = useState(false);
  const [fpContact, setFpContact] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpStep, setFpStep] = useState(1); 
  const [fpLoading, setFpLoading] = useState(false);

  const handleLogin = async () => {
    if (!contact || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      let formattedContact = contact.trim();
      if (/^\d{10}$/.test(formattedContact)) {
        formattedContact = `+91${formattedContact}`;
      }

      const result = await signIn(formattedContact, password.trim());
      if (result.success && result.user) {
        registerForPushNotificationsAsync(result.user.id || result.user._id);
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFpOtp = async () => {
    if (!fpContact) {
      Alert.alert('Error', 'Please enter your registered contact');
      return;
    }
    setFpLoading(true);
    try {
      const response = await sendOtp(fpContact);
      if (response.success) {
        setFpStep(2);
        Alert.alert('OTP Sent', 'Check your messages or email for the OTP.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!fpOtp || !fpNewPassword) {
      Alert.alert('Error', 'Please enter OTP and new password');
      return;
    }
    setFpLoading(true);
    try {
      const verifyRes = await verifyOtp(fpContact, fpOtp);
      if (verifyRes.success && verifyRes.otp_verified_token) {
        const resetRes = await resetPassword(fpContact, fpNewPassword, verifyRes.otp_verified_token);
        if (resetRes.success) {
          Alert.alert('Success', 'Password reset successfully. You can now login.');
          setFpModalVisible(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid OTP or failed to reset password');
    } finally {
      setFpLoading(false);
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
            <ZoraInput
              label="Email or Phone"
              placeholder="Enter your contact"
              value={contact}
              onChangeText={setContact}
              autoCapitalize="none"
            />
            <ZoraInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              onPress={() => { setFpModalVisible(true); setFpStep(1); }}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <ZoraButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: SPACING.md }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Zora? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpText}>Join Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={fpModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            {fpStep === 1 ? (
              <>
                <ZoraInput label="Contact" placeholder="Enter Phone or Email" value={fpContact} onChangeText={setFpContact} />
                <ZoraButton title="Send OTP" onPress={handleSendFpOtp} loading={fpLoading} />
              </>
            ) : (
              <>
                <ZoraInput label="OTP" placeholder="6-Digit OTP" value={fpOtp} onChangeText={setFpOtp} keyboardType="number-pad" />
                <ZoraInput label="New Password" placeholder="••••••••" value={fpNewPassword} onChangeText={setFpNewPassword} secureTextEntry />
                <ZoraButton title="Reset Password" onPress={handleResetPassword} loading={fpLoading} />
              </>
            )}
            <TouchableOpacity onPress={() => setFpModalVisible(false)} style={styles.closeBtn}>
              <Text style={{color: COLORS.primary, fontWeight: 'bold', marginTop: 15}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  forgotText: {
    color: COLORS.accentGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textGray,
  },
  signUpText: {
    color: COLORS.accentGlow,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeBtn: {
    alignItems: 'center',
  }
});

export default LoginScreen;
