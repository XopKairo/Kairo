import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { COLORS, SPACING } from '../../../theme/theme';
import ZoraButton from '../../../components/ZoraButton';
import ZoraInput from '../../../components/ZoraInput';
import ZoraAlert from '../../../components/ZoraAlert';
import { useAuth } from '../../../context/AuthContext';
import auth from '@react-native-firebase/auth';

const HostRegistrationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [mobileNumber, setMobileNumber] = useState(user?.contact?.replace('+91', '') || '');
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const validatePhoneNumber = (number) => {
    // 1. Check length
    if (number.length !== 10) return "Please enter a 10-digit mobile number.";
    
    // 2. Check if starts with 6-9 (Indian standard)
    if (!/^[6-9]/.test(number)) return "Please enter a valid Indian mobile number.";

    // 3. Block all same digits (0000000000, 9999999999, etc.)
    if (/^(\d)\1{9}$/.test(number)) return "Invalid mobile number. Repeated digits detected.";

    // 4. Block common sequences
    const sequences = ["1234567890", "0123456789", "9876543210", "0987654321"];
    if (sequences.includes(number)) return "Suspicious number detected. Please use a real mobile number.";

    return null;
  };

  const handleGetOTP = async () => {
    const validationError = validatePhoneNumber(mobileNumber);
    if (validationError) {
      return showAlert('Invalid Number', validationError);
    }

    setLoading(true);
    try {
      const formattedContact = `+91${mobileNumber}`;
      let confirmation = null;
      try {
          confirmation = await auth().signInWithPhoneNumber(formattedContact);
      } catch (firebaseErr) {
          console.log("Firebase Auth Error:", firebaseErr.message);
          // Allow bypass just like login
      }
      
      navigation.navigate('HostOTP', { 
        mobileNumber: formattedContact,
        confirmation 
      });
    } catch(err) {
      showAlert("Error", "Failed to initiate host registration process.");
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
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft color={COLORS.textWhite} size={28} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Become a Host</Text>
            <Text style={styles.subtitle}>Verify your phone number to continue</Text>
          </View>

          <View style={styles.formCard}>
             <ZoraInput
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Enter 10 digit number"
                keyboardType="phone-pad"
                maxLength={10}
             />
             <View style={styles.infoBox}>
                <Text style={styles.infoText}>We require a verified phone number for all our hosts to ensure safety and authenticity on the platform.</Text>
             </View>

             <ZoraButton 
                title="Get OTP to Verify" 
                onPress={handleGetOTP} 
                loading={loading}
                style={{ marginTop: 20 }}
             />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, zIndex: 10, width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textWhite, marginBottom: 10 },
  subtitle: { color: COLORS.textGray, fontSize: 16 },
  formCard: { backgroundColor: COLORS.cardBackground, padding: SPACING.xl, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  infoBox: { backgroundColor: 'rgba(108, 43, 217, 0.1)', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: 'rgba(108, 43, 217, 0.3)' },
  infoText: { color: COLORS.accentGlow, fontSize: 13, lineHeight: 20, textAlign: 'center' }
});

export default HostRegistrationScreen;
