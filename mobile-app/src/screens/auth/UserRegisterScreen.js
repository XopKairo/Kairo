import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { registerUser, sendOtp, verifyOtp } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/pushService';

const UserRegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState('phone'); // 'phone' or 'email'
  const [contact, setContact] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // OTP States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const getFullContact = () => {
    return contactType === 'phone' ? `${countryCode}${contact}` : contact;
  };

  const handleSendOtp = async () => {
    if (!name || !contact || !password) {
      Alert.alert('Error', 'Please fill all fields before sending OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp(getFullContact());
      if (response.success) {
        setIsOtpSent(true);
        // For dev purposes, if the backend returns the OTP in the message (or if you check logs), you can see it.
        Alert.alert('OTP Sent', response.message);
        if (response.otp) {
            // Note: Remove this in production!
            console.log("Dev OTP:", response.otp);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      const verifyRes = await verifyOtp(getFullContact(), otp);
      if (verifyRes.success) {
        // 2. Register
        const isPhone = contactType === 'phone';
        const response = await registerUser(name, getFullContact(), password, isPhone);
        if (response.success && response.user) {
          registerForPushNotificationsAsync(response.user.id || response.user._id);
          Alert.alert('Success', 'Registration successful!', [
            { text: 'OK', onPress: () => navigation.replace('Main') }
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Invalid OTP or Registration Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          editable={!isOtpSent}
        />

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, contactType === 'phone' && styles.activeTab]} 
            onPress={() => { setContactType('phone'); setContact(''); }}
            disabled={isOtpSent}
          >
            <Text style={[styles.tabText, contactType === 'phone' && styles.activeTabText]}>Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, contactType === 'email' && styles.activeTab]} 
            onPress={() => { setContactType('email'); setContact(''); }}
            disabled={isOtpSent}
          >
            <Text style={[styles.tabText, contactType === 'email' && styles.activeTabText]}>Email</Text>
          </TouchableOpacity>
        </View>

        {contactType === 'phone' ? (
          <View style={styles.phoneContainer}>
             <TextInput
              style={styles.countryCodeInput}
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="phone-pad"
              editable={!isOtpSent}
            />
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              editable={!isOtpSent}
            />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={contact}
            onChangeText={setContact}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isOtpSent}
          />
        )}
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isOtpSent}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {isOtpSent && (
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
        )}

        {!isOtpSent ? (
          <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.verifyButton]} onPress={handleVerifyAndRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Register</Text>}
          </TouchableOpacity>
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8A2BE2',
    fontWeight: 'bold',
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  countryCodeInput: {
    height: 55,
    width: 70,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    marginRight: 10,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    height: 55,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  input: {
    height: 55,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#8A2BE2',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  verifyButton: {
    backgroundColor: '#32CD32',
    shadowColor: '#32CD32',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  loginText: {
    fontSize: 15,
    color: '#8A2BE2',
    fontWeight: 'bold',
  }
});

export default UserRegisterScreen;