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
      if (nextAppState === 'active') updateTimer();
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
      showAlert("Error", "Failed to resend OTP. Please wait.");
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < 6) return showAlert('Invalid OTP', 'Enter 6-digit code.');

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
        showAlert("Error", "Session expired. Go back and try again.");
      }
    } catch (error) {
      showAlert('Error', 'Invalid OTP. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
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
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.instructionText}>Enter the 6-digit code sent via SMS</Text>
            
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
                  maxLength={1}
                />
              ))}
            </View>

            <ZoraButton title="Verify Account" onPress={handleVerifyOTP} loading={loading} style={{ marginTop: 30 }} />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              {timer > 0 ? (
                <Text style={[styles.resendLink, { opacity: 0.5 }]}>Resend in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
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
  numberContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  numberText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  formCard: { backgroundColor: '#161026', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  instructionText: { color: '#9CA3AF', textAlign: 'center', marginBottom: 24, fontSize: 14 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  otpInput: { width: 40, height: 50, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  otpInputFilled: { borderColor: '#6C2BD9', backgroundColor: 'rgba(108, 43, 217, 0.1)' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  resendText: { color: '#9CA3AF' },
  resendLink: { color: '#A855F7', fontWeight: '600' }
});

export default OTPScreen;
