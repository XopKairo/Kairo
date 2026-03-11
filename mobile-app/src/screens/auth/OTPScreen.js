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
      const newConfirmation = await auth().signInWithPhoneNumber(mobileNumber);
      navigation.setParams({ confirmation: newConfirmation });
      endTimeRef.current = Date.now() + 30000;
      setTimer(30);
      showAlert("Success", "New OTP sent!", "success");
    } catch(err) {
      showAlert("Error", "Failed to resend OTP. Try again later.");
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < 6) return showAlert('Invalid OTP', 'Please enter the 6-digit code sent to your phone.');

    setLoading(true);
    try {
      if (confirmation) {
        const result = await confirmation.confirm(otpValue);
        const firebaseToken = await result.user.getIdToken();
        const verifyRes = await verifyOtp(mobileNumber, firebaseToken);
        
        if (verifyRes.success && verifyRes.otp_verified_token) {
           const loginRes = await signIn(mobileNumber, verifyRes.otp_verified_token);
           if(loginRes.success) {
               navigation.replace('Welcome');
           }
        }
      } else {
        showAlert("Wait", "Please use Fast Login button below for testing without real SMS.");
      }
    } catch (error) {
      showAlert('Error', 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypassLogin = async () => {
    setLoading(true);
    try {
      const verifyRes = await verifyOtp(mobileNumber, "9999"); 
      
      if (verifyRes.success && verifyRes.otp_verified_token) {
         try {
             const result = await signIn(mobileNumber, verifyRes.otp_verified_token);
             if(result.success) {
                 navigation.replace('Welcome');
             } else {
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             }
         } catch(loginErr) {
             if(loginErr.message?.includes('User not found')) {
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             } else {
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             }
         }
      } else {
         navigation.navigate('Register', { mobileNumber, otpToken: "9999" });
      }
    } catch (error) {
       navigation.navigate('Register', { mobileNumber, otpToken: "9999" });
    } finally {
      setLoading(false);
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

  return (
    <View style={styles.container}>
      <ZoraAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{color: '#FFF', fontSize: 30}}>←</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Verification</Text>
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>{mobileNumber}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.instructionText}>Enter the 6-digit code sent to your phone</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1)
                  selectTextOnFocus
                />
              ))}
            </View>

            <ZoraButton title="Verify & Continue" onPress={handleVerifyOTP} loading={loading} style={{ marginTop: 30 }} />

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
  container: { flex: 1, backgroundColor: '#0F0A19' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  numberContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  numberText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginRight: 10 },
  editBtn: { backgroundColor: 'rgba(108, 43, 217, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  editBtnText: { color: '#A855F7', fontSize: 12, fontWeight: '600' },
  formCard: { backgroundColor: '#161026', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  instructionText: { color: '#9CA3AF', textAlign: 'center', marginBottom: 24, fontSize: 14 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  otpInput: { width: 40, height: 50, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  otpInputFilled: { borderColor: '#6C2BD9', backgroundColor: 'rgba(108, 43, 217, 0.1)' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  resendText: { color: '#9CA3AF' },
  resendLink: { color: '#A855F7', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#9CA3AF', marginHorizontal: 15, fontSize: 12, fontWeight: 'bold' },
  fastLoginSection: { alignItems: 'center' },
  quoteText: { color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', fontSize: 13, marginBottom: 15, lineHeight: 20 },
  fastLoginBtn: { width: '100%', borderColor: '#6C2BD9' },
  waitText: { color: '#9CA3AF', fontSize: 11, marginTop: 8 }
});

export default OTPScreen;
