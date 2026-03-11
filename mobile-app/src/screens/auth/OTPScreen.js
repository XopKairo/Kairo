import React, { useState, useRef, useEffect } from 'react';
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
  AppState
} from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraAlert from '../../components/ZoraAlert';
import { useAuth } from '../../context/AuthContext';
import { verifyOtp } from '../../services/api';
import auth from '@react-native-firebase/auth';

const OTPScreen = ({ route, navigation }) => {
  const { mobileNumber, confirmation } = route.params;
  const { signIn } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Firebase uses 6 digits
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
      // Re-trigger Firebase SMS
      const newConfirmation = await auth().signInWithPhoneNumber(mobileNumber);
      navigation.setParams({ confirmation: newConfirmation });
      endTimeRef.current = Date.now() + 30000;
      setTimer(30);
      showAlert("Success", "New OTP sent!", "success");
    } catch(err) {
      showAlert("Error", "Failed to resend OTP. Try again later.");
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

  const handleBypassLogin = async () => {
    setLoading(true);
    try {
      console.log("Attempting Bypass Login for:", mobileNumber);
      const verifyRes = await verifyOtp(mobileNumber, "9999"); 
      
      if (verifyRes.success && verifyRes.otp_verified_token) {
         try {
             console.log("OTP Verified, attempting SignIn...");
             const result = await signIn(mobileNumber, verifyRes.otp_verified_token);
             if(result.success) {
                 console.log("SignIn Successful, navigating to Welcome");
                 navigation.replace('Welcome');
             } else {
                 console.log("SignIn Failed (no success flag):", result);
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             }
         } catch(loginErr) {
             console.log("SignIn Error Details:", loginErr);
             if(loginErr.message?.includes('User not found')) {
                 console.log("User not found, navigating to Register");
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             } else {
                 console.log("Unexpected Login Error, forcing Register as fallback");
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             }
         }
      } else {
         console.log("VerifyOtp Failed (no success flag):", verifyRes);
         navigation.navigate('Register', { mobileNumber, otpToken: "9999" });
      }
    } catch (error) {
       console.log("Bypass Login Master Catch Error:", error);
       navigation.navigate('Register', { mobileNumber, otpToken: "9999" });
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
          showAlert("Notice", "OTP service is currently unavailable. Please wait for the timer and use Fast Login.", "notice");
          setLoading(false);
          return;
      }

      // 1. Firebase Verification
      await confirmation.confirm(otpString);
      
      // 2. Get ID Token
      const fbUser = auth().currentUser;
      if (!fbUser) throw new Error("Firebase Authentication failed");
      const idToken = await fbUser.getIdToken();

      // 3. Verify with Backend
      const verifyRes = await verifyOtp(mobileNumber, idToken);
      
      if (verifyRes.success && verifyRes.otp_verified_token) {
         try {
             const result = await signIn(mobileNumber, verifyRes.otp_verified_token);
             if(result.success) {
                 navigation.replace('Welcome');
             }
         } catch(loginErr) {
             if(loginErr.message?.includes('User not found')) {
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             } else {
                 showAlert('Login Failed', loginErr.message || 'An error occurred');
             }
         }
      }
    } catch (error) {
       showAlert('Verification Failed', "Invalid OTP or expired session.");
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
            <Text style={styles.title}>Verification</Text>
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

            <ZoraButton title="Verify & Continue" onPress={handleVerifyOTP} loading={loading} style={{ marginTop: SPACING.lg }} />

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
              <Text style={styles.quoteText}>"Instant access for the elite. Skip the wait and jump right in."</Text>
              <ZoraButton 
                title="Fast Login (Bypass OTP)" 
                onPress={handleBypassLogin} 
                variant="outline"
                style={styles.fastLoginBtn}
                disabled={timer > 0}
              />
              {timer > 0 && <Text style={styles.waitText}>Fast Login available in {timer}s</Text>}
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

export default OTPScreen;
