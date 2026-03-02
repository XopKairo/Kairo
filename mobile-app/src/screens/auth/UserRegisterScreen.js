import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { registerUser, sendOtp, verifyOtp } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const UserRegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Female'); 
  const [selfie, setSelfie] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const getFullContact = () => {
    return `${countryCode}${contact.trim()}`;
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access for gender verification.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled) {
      setSelfie(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
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
    if (gender === 'Female' && !selfie) {
      Alert.alert('Verification Required', 'Female hosts must upload a selfie for verification.');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp(getFullContact());
      if (response.success) {
        setIsOtpSent(true);
        Alert.alert('OTP Sent', 'Check your messages for the 6-digit code.');
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
      if (verifyRes.success) {
        const response = await registerUser(
          name.trim(), 
          getFullContact(), 
          password, 
          true, 
          gender, 
          selfie, 
          verifyRes.otp_verified_token
        );
        if (response.success) {
          Alert.alert('Success', 'Registration complete!', [
            { text: 'OK', onPress: () => navigation.replace('UserLogin') }
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Failed', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the Zora community</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Icon name="person-outline" size={20} color="#8A2BE2" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
            </View>

            <Text style={styles.label}>Identify as:</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity style={[styles.genderBtn, gender === 'Female' && styles.activeGender]} onPress={() => setGender('Female')}>
                <Icon name="woman-outline" size={20} color={gender === 'Female' ? '#fff' : '#8A2BE2'} />
                <Text style={[styles.genderText, gender === 'Female' && styles.activeGenderText]}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.genderBtn, gender === 'Male' && styles.activeGender]} onPress={() => setGender('Male')}>
                <Icon name="man-outline" size={20} color={gender === 'Male' ? '#fff' : '#8A2BE2'} />
                <Text style={[styles.genderText, gender === 'Male' && styles.activeGenderText]}>Male</Text>
              </TouchableOpacity>
            </View>

            {gender === 'Female' && (
              <TouchableOpacity style={styles.selfieBtn} onPress={takeSelfie}>
                {selfie ? (
                  <Image source={{ uri: selfie }} style={styles.previewImage} />
                ) : (
                  <>
                    <Icon name="camera" size={30} color="#8A2BE2" />
                    <Text style={styles.selfieBtnText}>Add Verification Selfie</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.contactRow}>
              <TextInput style={styles.ccInput} value={countryCode} onChangeText={setCountryCode} />
              <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
                <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={contact} onChangeText={setContact} keyboardType="phone-pad" maxLength={10} />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#8A2BE2" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Icon name={showPassword ? "eye-off" : "eye"} size={22} color="#8A2BE2" />
              </TouchableOpacity>
            </View>

            {isOtpSent && (
              <View style={styles.inputContainer}>
                <Icon name="shield-checkmark-outline" size={20} color="#32CD32" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="6-Digit OTP" placeholderTextColor="#666" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
              </View>
            )}

            <TouchableOpacity style={styles.registerBtn} onPress={isOtpSent ? handleVerifyAndRegister : handleSendOtp} disabled={loading}>
              <LinearGradient colors={['#8A2BE2', '#6a11cb']} style={styles.btnGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isOtpSent ? 'VERIFY & REGISTER' : 'SEND OTP'}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('UserLogin')} style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  eyeIcon: { padding: 5 },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  genderBtn: { 
    flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#8A2BE2',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
  },
  activeGender: { backgroundColor: '#8A2BE2' },
  genderText: { color: '#8A2BE2', fontWeight: 'bold' },
  activeGenderText: { color: '#fff' },
  selfieBtn: { 
    height: 120, borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, 
    borderColor: '#8A2BE2', backgroundColor: '#f9f9f9', justifyContent: 'center', 
    alignItems: 'center', marginBottom: 15, overflow: 'hidden' 
  },
  previewImage: { width: '100%', height: '100%' },
  selfieBtnText: { color: '#8A2BE2', marginTop: 5, fontWeight: 'bold', fontSize: 12 },
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
  loginLink: { color: '#8A2BE2', fontWeight: 'bold' }
});

export default UserRegisterScreen;
