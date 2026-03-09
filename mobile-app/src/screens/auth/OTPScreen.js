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
  TextInput
} from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import { useAuth } from '../../context/AuthContext';
import { verifyOtp } from '../../services/api';
import auth from '@react-native-firebase/auth';

const OTPScreen = ({ route, navigation }) => {
  const { mobileNumber, confirmation } = route.params;
  const { signIn } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Firebase uses 6 digits
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleResendOTP = async () => {
    try {
      // Re-trigger Firebase SMS
      const newConfirmation = await auth().signInWithPhoneNumber(mobileNumber);
      navigation.setParams({ confirmation: newConfirmation });
      setTimer(60);
      Alert.alert("Success", "New OTP sent!");
    } catch(err) {
      Alert.alert("Error", "Failed to resend OTP. Try again later.");
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

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
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
                 Alert.alert('Login Failed', loginErr.message || 'An error occurred');
             }
         }
      }
    } catch (error) {
       Alert.alert('Verification Failed', "Invalid OTP or expired session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
  resendLink: { color: COLORS.accentGlow, fontWeight: '600' }
});

export default OTPScreen;
