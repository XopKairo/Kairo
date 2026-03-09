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
import { verifyOtp, sendOtp } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/pushService';

const OTPScreen = ({ route, navigation }) => {
  const { mobileNumber } = route.params;
  const { signIn } = useAuth(); // Re-use signIn for the 'Fast Login'
  
  const [otp, setOtp] = useState(['', '', '', '']);
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
      await sendOtp(mobileNumber);
      setTimer(60);
    } catch(err) {
      Alert.alert("Error", err.message || "Failed to resend OTP");
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 3) {
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
    if (otpString.length < 4) { // Changed to 6 later if backend needs it, but matching UI here
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      const verifyRes = await verifyOtp(mobileNumber, otpString);
      
      if (verifyRes.success && verifyRes.otp_verified_token) {
         // Attempt to login using the token
         try {
             const result = await signIn(mobileNumber, verifyRes.otp_verified_token);
             if(result.success) {
                 navigation.replace('Welcome');
             }
         } catch(loginErr) {
             // If login fails because user not found, navigate to Register with token
             if(loginErr.message === "User not found. Please register." || loginErr.message?.includes('User not found')) {
                 navigation.navigate('Register', { mobileNumber, otpToken: verifyRes.otp_verified_token });
             } else {
                 Alert.alert('Login Failed', loginErr.message || 'An error occurred');
             }
         }
      }
    } catch (error) {
       Alert.alert('Verification Failed', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFastLogin = async () => {
    // Fast Login without OTP is not secure for real users unless it's a dev mode. 
    // We will simulate sending OTP and auto-filling for demo or redirect to OTP request
    Alert.alert("Fast Login", "Please enter OTP to login securely.");
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Mobile Verification</Text>
            
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>{mobileNumber}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✎ Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.instructionText}>Enter the 4-digit OTP sent to your number</Text>
            
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

            <ZoraButton
              title="Verify OTP"
              onPress={handleVerifyOTP}
              loading={loading}
              style={{ marginTop: SPACING.lg }}
            />

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

            {timer === 0 && (
              <View>
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.line} />
                </View>

                <ZoraButton
                  title="Fast Login"
                  onPress={handleFastLogin}
                  loading={loading}
                  style={styles.fastLoginBtn}
                  textStyle={styles.fastLoginText}
                />
              </View>
            )}
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
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginBottom: 16,
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  numberText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  editBtn: {
    backgroundColor: 'rgba(108, 43, 217, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editBtnText: {
    color: COLORS.accentGlow,
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  instructionText: {
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: COLORS.textWhite,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 43, 217, 0.1)',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    color: COLORS.textGray,
  },
  resendLink: {
    color: COLORS.accentGlow,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orText: {
    color: COLORS.textGray,
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fastLoginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  fastLoginText: {
    color: COLORS.primary,
  }
});

export default OTPScreen;
