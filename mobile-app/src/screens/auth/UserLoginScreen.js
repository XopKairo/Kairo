import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Modal, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { loginUser, sendOtp, resetPassword, verifyOtp } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/pushService';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

const UserLoginScreen = ({ navigation }) => {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIconLoaded, setIsIconLoaded] = useState(false);

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

  // Forgot Password States
  const [fpModalVisible, setFpModalVisible] = useState(false);
  const [fpContact, setFpContact] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpStep, setFpStep] = useState(1); 
  const [fpLoading, setFpLoading] = useState(false);

  const handleLogin = async () => {
    if (!contact || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    setLoading(true);
    const timeoutId = setTimeout(() => {
      setLoading(false);
      Alert.alert('Timeout', 'Login is taking too long. Please check your network.');
    }, 10000);

    try {
      let formattedContact = contact.trim();
      // Auto-prefix +91 if it looks like a 10-digit Indian phone number
      if (/^\d{10}$/.test(formattedContact)) {
        formattedContact = `+91${formattedContact}`;
      }

      const response = await loginUser(formattedContact, password.trim());
      clearTimeout(timeoutId);
      if (response.success && response.user) {
        registerForPushNotificationsAsync(response.user.id || response.user._id);
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFpOtp = async () => {
    if (!fpContact) {
      Alert.alert('Error', 'Please enter your registered phone number');
      return;
    }
    setFpLoading(true);
    try {
      const response = await sendOtp(fpContact);
      if (response.success) {
        setFpStep(2);
        Alert.alert('OTP Sent', 'Check your messages for the OTP.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!fpOtp || !fpNewPassword) {
      Alert.alert('Error', 'Please enter OTP and new password');
      return;
    }
    setFpLoading(true);
    try {
      const verifyRes = await verifyOtp(fpContact, fpOtp);
      if (verifyRes.success) {
        const resetRes = await resetPassword(fpContact, fpNewPassword);
        if (resetRes.success) {
          Alert.alert('Success', 'Password reset successfully. You can now login.');
          setFpModalVisible(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid OTP or failed to reset password');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#8A2BE2', '#4B0082']} style={styles.logoGradient}>
                <Image source={require('../../../assets/icon.png')} style={styles.logo} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Zora</Text>
            <Text style={styles.subtitle}>Connect and Earn</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.loginText}>Login</Text>
            
            <View style={styles.inputContainer}>
              {isIconLoaded && Icon ? <Icon name="account-outline" size={20} color="#8A2BE2" style={styles.inputIcon} /> : <View style={{width:20,height:20,marginRight:10}}/>}
              <TextInput
                style={styles.input}
                placeholder="Phone or Email"
                placeholderTextColor="#666"
                value={contact}
                onChangeText={setContact}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              {isIconLoaded && Icon ? <Icon name="lock-outline" size={20} color="#8A2BE2" style={styles.inputIcon} /> : <View style={{width:20,height:20,marginRight:10}}/>}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {isIconLoaded && Icon ? <Icon name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#8A2BE2" /> : <View style={{width: 24, height: 24}} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => { setFpModalVisible(true); setFpStep(1); }}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={['#8A2BE2', '#6a11cb']} style={styles.btnGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SIGN IN</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Zora? </Text>
              <TouchableOpacity onPress={() => navigation.replace('Register')}>
                <Text style={styles.signUpText}>Join Now</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>

      {/* Forgot Password Modal */}
      <Modal visible={fpModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            {fpStep === 1 ? (
              <>
                <TextInput style={styles.modalInput} placeholder="Enter Phone Number" placeholderTextColor="#999" value={fpContact} onChangeText={setFpContact} />
                <TouchableOpacity style={styles.modalBtn} onPress={handleSendFpOtp}>
                  <Text style={styles.btnText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput style={styles.modalInput} placeholder="6-Digit OTP" value={fpOtp} onChangeText={setFpOtp} keyboardType="number-pad" />
                <TextInput style={styles.modalInput} placeholder="New Password" value={fpNewPassword} onChangeText={setFpNewPassword} secureTextEntry />
                <TouchableOpacity style={styles.modalBtn} onPress={handleResetPassword}>
                  <Text style={styles.btnText}>Reset</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => setFpModalVisible(false)} style={styles.closeBtn}>
              <Text style={{color: '#8A2BE2'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 25, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 100, height: 100, borderRadius: 25, elevation: 15,
    shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 15, backgroundColor: '#fff'
  },
  logoGradient: { flex: 1, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 60, height: 60, resizeMode: 'contain', tintColor: '#fff' },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 15, letterSpacing: 2 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, letterSpacing: 1 },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 30, padding: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
  },
  loginText: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 25, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0',
    borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: '#e0e0e0'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#333', fontSize: 16 },
  eyeIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 14 },
  loginBtn: { height: 55, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666' },
  signUpText: { color: '#8A2BE2', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  modalInput: { width: '100%', height: 50, backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, color: '#333' },
  modalBtn: { width: '100%', height: 50, backgroundColor: '#8A2BE2', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { marginTop: 15 }
});

export default UserLoginScreen;
