import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  AppState
} from 'react-native';
import { COLORS, SPACING } from '../../../theme/theme';
import ZoraButton from '../../../components/ZoraButton';
import ZoraAlert from '../../../components/ZoraAlert';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import auth from '@react-native-firebase/auth';

const HostOTPScreen = ({ route, navigation }) => {
  const { mobileNumber, confirmation } = route.params;
  const { user } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const endTimeRef = useRef(Date.now() + 30000);
  const inputRefs = useRef([]);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimer(remaining);
    };

    const interval = setInterval(updateTimer, 1000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        updateTimer();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const handleResendOTP = async () => {
    try {
      const newConfirmation = await auth().signInWithPhoneNumber(mobileNumber);
      navigation.setParams({ confirmation: newConfirmation });
      endTimeRef.current = Date.now() + 30000;
      setTimer(30);
      showAlert('Success', 'New OTP sent!', 'success');
    } catch(err) {
      showAlert('Error', 'Failed to resend OTP. Try again later.');
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const executeHostUpgrade = async () => {
    try {
      await api.patch(`/users/${user._id || user.id}/upgrade-to-host`);
      showAlert('Success', 'You are now registered as a host!', 'success');
      setTimeout(() => {
        navigation.navigate('Main', { screen: 'Profile' });
      }, 2000);
    } catch (err) {
      showAlert('Upgrade Failed', err.response?.data?.message || 'Could not upgrade account to host.');
    }
  };

  const handleBypassLogin = async () => {
    setLoading(true);
    try {
      await executeHostUpgrade();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      showAlert('Error', 'Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      if (!confirmation) {
          showAlert('Notice', 'OTP service is currently unavailable. Please wait for the timer and use Fast Verification.', 'notice');
          setLoading(false);
          return;
      }

      await confirmation.confirm(otpString);
      await executeHostUpgrade();
      
    } catch (error) {
       showAlert('Verification Failed', 'Invalid OTP or expired session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ZoraAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Host Verification</Text>
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>{mobileNumber}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✎ Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.instructionText}>Enter the 6-digit code sent to you</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => inputRefs.current[index] = ref}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <ZoraButton title="Verify & Upgrade" onPress={handleVerifyOTP} loading={loading} style={{ marginTop: SPACING.lg }} />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              {timer > 0 ? (
                <Text style={[styles.resendLink, { opacity: 0.5 }]}>Wait {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.fastLoginSection}>
              <Text style={styles.quoteText}>"Ready to host? Skip the verification wait and start earning instantly."</Text>
              <ZoraButton 
                title="Fast Verification (Bypass)" 
                onPress={handleBypassLogin} 
                variant="outline"
                style={styles.fastLoginBtn}
                disabled={timer > 0}
              />
              {timer > 0 && <Text style={styles.waitText}>Fast Verification available in {timer}s</Text>}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  scrollContent: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textWhite, marginBottom: 16 },
  numberContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  numberText: { color: COLORS.textWhite, fontSize: 16, fontWeight: '600', marginRight: 10 },
  editBtn: { backgroundColor: 'rgba(108, 43, 217, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  editBtnText: { color: COLORS.accentGlow, fontSize: 12, fontWeight: '600' },
  formCard: { backgroundColor: COLORS.cardBackground, padding: SPACING.xl, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  instructionText: { color: COLORS.textGray, textAlign: 'center', marginBottom: 24, fontSize: 14 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  otpInput: { width: 45, height: 55, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: COLORS.textWhite, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(108, 43, 217, 0.1)' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  resendText: { color: COLORS.textGray },
  resendLink: { color: COLORS.accentGlow, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: COLORS.textGray, marginHorizontal: 15, fontSize: 12, fontWeight: 'bold' },
  fastLoginSection: { alignItems: 'center' },
  quoteText: { color: COLORS.textGray, fontStyle: 'italic', textAlign: 'center', fontSize: 13, marginBottom: 15, paddingHorizontal: 10, lineHeight: 20 },
  fastLoginBtn: { width: '100%', borderColor: COLORS.primary },
  waitText: { color: COLORS.textGray, fontSize: 11, marginTop: 8 }
});

export default HostOTPScreen;

