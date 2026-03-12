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
  TextInput,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraAlert from '../../components/ZoraAlert';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });
  const { googleSignIn } = useAuth();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '343792605839-1siolslgaeo03t4a3he0tq3nbi7cfns0.apps.googleusercontent.com', // Web Client ID from your google-services.json oauth_client
    });
  }, []);

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleGoogleSignIn = async () => {
    if (!isTermsAccepted) {
      showAlert('Terms and Conditions', 'Please accept the Terms and Conditions to proceed.', 'notice');
      return;
    }
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken || userInfo.data?.idToken; // handle both new and old package responses
      
      if (!idToken) throw new Error('Failed to get Google Token');

      const loginRes = await googleSignIn(idToken);
      if (loginRes.success) {
        if (loginRes.isNewUser) {
           // Could optionally navigate to a setup profile screen here if needed, but going to Welcome is fine.
           navigation.replace('Welcome');
        } else {
           navigation.replace('Welcome'); // AuthContext state update might handle the actual navigation via root stack, but this is safe
        }
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert("Error", "Play services not available or outdated");
      } else {
        showAlert("Error", error.message || "Google Sign-In failed", "error");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGetOTP = async () => {
    if (!mobileNumber) {
      showAlert('Error', 'Please enter your mobile number');
      return;
    }
    if (mobileNumber.length < 10) {
      showAlert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!isTermsAccepted) {
      showAlert('Terms and Conditions', 'Please accept the Terms and Conditions to proceed.', 'notice');
      return;
    }

    setLoading(true);
    try {
        const cleanNumber = mobileNumber.replace(/\s+/g, '');
        const formattedContact = `+91${cleanNumber}`;
        let confirmation = null;
        try {
            // Firebase Phone Auth
            confirmation = await auth().signInWithPhoneNumber(formattedContact);
        } catch (firebaseErr) {
            console.log("Firebase Auth Error:", firebaseErr.message);
            // We ignore the error here to navigate to the OTP screen anyway.
            // This allows the user to wait for the timer and use the Fast Login fallback.
        }
        
        navigation.navigate('OTP', { 
          mobileNumber: formattedContact,
          confirmation 
        });
    } catch(err) {
        showAlert("Error", err.message || "Failed to process request.", "error");
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

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <View style={styles.googleButtonContent}>
                  <View style={styles.googleIconCircle}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: COLORS.textGray,
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: COLORS.backgroundDark,
    fontSize: 18,
    fontWeight: '900',
  },
  googleButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
