import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity, 
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { registerUser, sendOtp, verifyOtp } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';

const UserRegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!name || !contact || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      let formattedContact = contact.trim();
      if (/^\d{10}$/.test(formattedContact)) formattedContact = `+91${formattedContact}`;

      const response = await sendOtp(formattedContact);
      if (response.success) {
        setIsOtpSent(true);
        setResendTimer(60);
        Alert.alert('OTP Sent', 'Please check your messages');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otp) return Alert.alert('Error', 'Enter OTP');

    setLoading(true);
    try {
      let formattedContact = contact.trim();
      if (/^\d{10}$/.test(formattedContact)) formattedContact = `+91${formattedContact}`;

      const verifyRes = await verifyOtp(formattedContact, otp);
      if (verifyRes.success && verifyRes.otp_verified_token) {
        const response = await registerUser(
          name.trim(), 
          formattedContact, 
          password, 
          true, 
          verifyRes.otp_verified_token
        );
        
        if (response.success) {
          Alert.alert('Success', 'Welcome to ZORA!', [
            { text: 'Start Exploring', onPress: () => navigation.replace('Login') }
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Check your details and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft color={COLORS.textWhite} size={28} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Begin your elite journey with Zora</Text>
          </View>

          <View style={styles.formCard}>
            {!isOtpSent ? (
              <>
                <ZoraInput label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
                <ZoraInput label="Phone Number" placeholder="1234567890" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
                <ZoraInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
                <ZoraButton title="Continue" onPress={handleSendOtp} loading={loading} style={{ marginTop: 10 }} />
              </>
            ) : (
              <>
                <Text style={styles.otpInfo}>Enter the code sent to {contact}</Text>
                <ZoraInput label="OTP" placeholder="000000" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
                <ZoraButton title="Verify & Register" onPress={handleRegister} loading={loading} />
                <TouchableOpacity disabled={resendTimer > 0} onPress={handleSendOtp} style={styles.resendBtn}>
                  <Text style={[styles.resendText, resendTimer > 0 && { opacity: 0.5 }]}>
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </>
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
  backBtn: {
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textWhite,
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
  otpInfo: {
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.accentGlow,
    fontWeight: 'bold',
  }
});

export default UserRegisterScreen;
