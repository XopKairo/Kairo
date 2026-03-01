import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { loginUser, sendOtp, resetPassword, verifyOtp } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/pushService';
import { LinearGradient } from 'expo-linear-gradient';

const UserLoginScreen = ({ navigation }) => {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [fpModalVisible, setFpModalVisible] = useState(false);
  const [fpContact, setFpContact] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpStep, setFpStep] = useState(1); // 1: Contact, 2: OTP & New Password
  const [fpLoading, setFpLoading] = useState(false);

  const handleLogin = async () => {
    if (!contact || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await loginUser(contact, password);
      if (response.success && response.user) {
        registerForPushNotificationsAsync(response.user.id || response.user._id);
        navigation.replace('Main');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFpOtp = async () => {
    if (!fpContact) {
      Alert.alert('Error', 'Please enter your registered email or phone');
      return;
    }
    setFpLoading(true);
    try {
      const response = await sendOtp(fpContact);
      if (response.success) {
        setFpStep(2);
        Alert.alert('OTP Sent', 'Check your messages for the OTP.');
        if (response.otp) console.log("Dev OTP:", response.otp);
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
          setFpStep(1);
          setFpContact('');
          setFpOtp('');
          setFpNewPassword('');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid OTP or failed to reset password');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Replace with your actual logo path, using a placeholder for now */}
        <Image source={require('../../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.brandName}>Zora</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email or Phone Number"
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => { setFpModalVisible(true); setFpStep(1); }}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={['#8A2BE2', '#4B0082']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={fpModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <TouchableOpacity style={styles.closeIcon} onPress={() => setFpModalVisible(false)}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Reset Password</Text>
            
            {fpStep === 1 ? (
              <>
                <Text style={styles.modalSubtitle}>Enter your registered email or phone to receive an OTP.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Phone Number"
                  value={fpContact}
                  onChangeText={setFpContact}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleSendFpOtp} disabled={fpLoading}>
                  {fpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Send OTP</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Enter the OTP sent to {fpContact}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={fpOtp}
                  onChangeText={setFpOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  value={fpNewPassword}
                  onChangeText={setFpNewPassword}
                  secureTextEntry
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleResetPassword} disabled={fpLoading}>
                  {fpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Reset Password</Text>}
                </TouchableOpacity>
              </>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb', // slightly premium background
  },
  headerContainer: {
    flex: 0.4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
    borderRadius: 20,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    flex: 0.6,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    height: 55,
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 15,
    color: '#666',
  },
  registerText: {
    fontSize: 15,
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 50,
  },
  closeIcon: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#8A2BE2',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserLoginScreen;