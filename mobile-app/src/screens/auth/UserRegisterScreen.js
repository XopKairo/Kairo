import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Snackbar } from 'react-native-paper';
import { registerUser, sendOtp, verifyOtp } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';

const { width } = Dimensions.get('window');

const UserRegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Male'); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isIconLoaded, setIsIconLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setIsIconLoaded(true);
    if (Platform.OS === 'android') {
      setTimeout(() => {
        if (mounted && NavigationBar && NavigationBar.setVisibilityAsync) {
          NavigationBar.setVisibilityAsync('hidden').catch(() => {});
          NavigationBar.setBehaviorAsync('inset-touch').catch(() => {});
        }
      }, 100);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const getFullContact = () => {
    return `${countryCode}${contact.trim()}`;
  };

  const handleSendOtp = async () => {
    if (!name || !contact || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (contact.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp(getFullContact());
      if (response.success) {
        setIsOtpSent(true);
        setSnackbarVisible(true);
        setResendTimer(60);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp) return Alert.alert('Error', 'Enter OTP');

    setLoading(true);
    try {
      const verifyRes = await verifyOtp(getFullContact(), otp);
      
      if (verifyRes.success && verifyRes.otp_verified_token) {
        const response = await registerUser(
          name.trim(), 
          getFullContact(), 
          password, 
          true, 
          gender, 
          '', 
          verifyRes.otp_verified_token
        );
        
        if (response.success) {
          Alert.alert('Success', 'Registration complete!', [
            { text: 'OK', onPress: () => navigation.replace('Login') }
          ]);
        } else {
           Alert.alert('Failed', response.message || 'Registration failed');
        }
      } else {
         Alert.alert('Error', 'OTP verification failed');
      }
    } catch (error) {
      Alert.alert('Failed', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isIconLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the Zora community</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                {/* <Icon name="account-outline" size={20} color="#8A2BE2" style={styles.inputIcon} /> */}
                <View style={{width:20,height:20,marginRight:10}}/>
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
              </View>

              <Text style={styles.label}>Identify as:</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity style={[styles.genderBtn, gender === 'Female' && styles.activeGender]} onPress={() => setGender('Female')}>
                  {/* <Icon name="gender-female" size={20} color={gender === 'Female' ? '#fff' : '#8A2BE2'} /> */}
                  <View style={{width:20,height:20}}/>
                  <Text style={[styles.genderText, gender === 'Female' && styles.activeGenderText]}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.genderBtn, gender === 'Male' && styles.activeGender]} onPress={() => setGender('Male')}>
                  {/* <Icon name="gender-male" size={20} color={gender === 'Male' ? '#fff' : '#8A2BE2'} /> */}
                  <View style={{width:20,height:20}}/>
                  <Text style={[styles.genderText, gender === 'Male' && styles.activeGenderText]}>Male</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.contactRow}>
                <TextInput style={styles.ccInput} value={countryCode} onChangeText={setCountryCode} />
                <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
                  <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={contact} onChangeText={setContact} keyboardType="phone-pad" maxLength={10} />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                {/* <Icon name="lock-outline" size={20} color="#8A2BE2" style={styles.inputIcon} /> */}
                <View style={{width:20,height:20,marginRight:10}}/>
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {/* <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#8A2BE2" /> */}
                  <Text style={{color: '#8A2BE2', fontSize: 12}}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
              </View>

              {isOtpSent && (
                <View style={styles.otpSection}>
                  <View style={styles.inputContainer}>
                    {isIconLoaded && Icon ? <Icon name="shield-check-outline" size={20} color="#32CD32" style={styles.inputIcon} /> : <View style={{width:20,height:20,marginRight:10}}/>}
                    <TextInput style={styles.input} placeholder="6-Digit OTP" placeholderTextColor="#666" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
                  </View>
                  <TouchableOpacity disabled={resendTimer > 0} onPress={handleSendOtp} style={styles.resendBtn}>
                    <Text style={[styles.resendText, resendTimer > 0 && styles.disabledText]}>
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.registerBtn} onPress={isOtpSent ? handleVerifyAndRegister : handleSendOtp} disabled={loading}>
                <LinearGradient colors={['#8A2BE2', '#6a11cb']} style={styles.btnGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isOtpSent ? 'VERIFY & REGISTER' : 'SEND OTP'}</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        OTP Sent! Check your messages.
      </Snackbar>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 25, justifyContent: 'center' },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 30, padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 5 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0',
    borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: '#e0e0e0'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#333', fontSize: 16 },
  eyeIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  genderBtn: { 
    flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#8A2BE2',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
  },
  activeGender: { backgroundColor: '#8A2BE2' },
  genderText: { color: '#8A2BE2', fontWeight: 'bold' },
  activeGenderText: { color: '#fff' },
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  ccInput: { 
    width: 60, height: 55, backgroundColor: '#f0f0f0', borderRadius: 15, 
    textAlign: 'center', borderWidth: 1, borderColor: '#e0e0e0', color: '#333', fontWeight: 'bold' 
  },
  registerBtn: { height: 55, borderRadius: 15, overflow: 'hidden', marginTop: 10, elevation: 5 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666' },
  loginLink: { color: '#8A2BE2', fontWeight: 'bold' },
  snackbar: { backgroundColor: '#8A2BE2' },
  otpSection: { marginBottom: 15 },
  resendBtn: { alignSelf: 'flex-end', marginTop: -10, padding: 5 },
  resendText: { color: '#8A2BE2', fontSize: 13, fontWeight: '600' },
  disabledText: { color: '#999' }
});

export default UserRegisterScreen;
