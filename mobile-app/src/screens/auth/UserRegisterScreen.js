import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { registerUser, sendOtp, verifyOtp } from '../../services/api';
import { registerForPushNotificationsAsync } from '../../services/pushService';

const UserRegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState('phone'); 
  const [contact, setContact] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Female'); 
  const [selfie, setSelfie] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');

  const getFullContact = () => {
    return contactType === 'phone' ? `${countryCode}${contact}` : contact;
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access to verify your identity');
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
    if (gender === 'Female' && !selfie) {
      Alert.alert('Verification Required', 'Female hosts must upload a selfie for gender verification to earn coins.');
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
        const isPhone = contactType === 'phone';
        const response = await registerUser(
          name, 
          getFullContact(), 
          password, 
          isPhone, 
          gender, 
          selfie, 
          verifyRes.otp_verified_token
        );
        if (response.success) {
          Alert.alert('Success', 'Registration complete!', [{ text: 'OK', onPress: () => navigation.replace('Main') }]);
        }
      }
    } catch (error) {
      Alert.alert('Failed', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Join Zora</Text>
        <Text style={styles.subtitle}>Create your profile to start</Text>
        
        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity style={[styles.genderBtn, gender === 'Female' && styles.activeGender]} onPress={() => setGender('Female')}>
            <Text style={[styles.genderText, gender === 'Female' && styles.activeGenderText]}>Female (Host)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.genderBtn, gender === 'Male' && styles.activeGender]} onPress={() => setGender('Male')}>
            <Text style={[styles.genderText, gender === 'Male' && styles.activeGenderText]}>Male (User)</Text>
          </TouchableOpacity>
        </View>

        {gender === 'Female' && (
          <View style={styles.selfieSection}>
            <TouchableOpacity style={styles.selfieBtn} onPress={takeSelfie}>
              {selfie ? (
                <Image source={{ uri: selfie }} style={styles.previewImage} />
              ) : (
                <>
                  <Icon name="camera" size={30} color="#8A2BE2" />
                  <Text style={styles.selfieBtnText}>Take Verification Selfie</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>Face must be clearly visible for admin approval.</Text>
          </View>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, contactType === 'phone' && styles.activeTab]} onPress={() => setContactType('phone')}>
            <Text style={[styles.tabText, contactType === 'phone' && styles.activeTabText]}>Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, contactType === 'email' && styles.activeTab]} onPress={() => setContactType('email')}>
            <Text style={[styles.tabText, contactType === 'email' && styles.activeTabText]}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          {contactType === 'phone' && <TextInput style={styles.ccInput} value={countryCode} editable={false} />}
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            placeholder={contactType === 'phone' ? "Phone Number" : "Email Address"} 
            value={contact} 
            onChangeText={setContact} 
            keyboardType={contactType === 'phone' ? "phone-pad" : "email-address"}
          />
        </View>
        
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#666" /></TouchableOpacity>
        </View>

        {isOtpSent && <TextInput style={styles.input} placeholder="6-Digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />}

        <TouchableOpacity style={[styles.button, isOtpSent && styles.verifyButton]} onPress={isOtpSent ? handleVerifyAndRegister : handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isOtpSent ? 'Verify & Finish' : 'Send OTP'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 25, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#8A2BE2' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genderBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  activeGender: { borderColor: '#8A2BE2', backgroundColor: '#f3e5f5' },
  genderText: { color: '#666' },
  activeGenderText: { color: '#8A2BE2', fontWeight: 'bold' },
  selfieSection: { marginBottom: 20, alignItems: 'center' },
  selfieBtn: { width: '100%', height: 150, borderStyle: 'dashed', borderWidth: 2, borderColor: '#8A2BE2', borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  selfieBtnText: { color: '#8A2BE2', marginTop: 10, fontWeight: 'bold' },
  helperText: { fontSize: 12, color: '#999', marginTop: 5 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 3 },
  tab: { flex: 1, padding: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#666' },
  activeTabText: { color: '#8A2BE2', fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', gap: 10 },
  ccInput: { width: 60, height: 50, backgroundColor: '#f9f9f9', borderRadius: 10, textAlign: 'center', borderWidth: 1, borderColor: '#eee' },
  input: { height: 50, backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  passwordInput: { flex: 1, height: 50 },
  button: { backgroundColor: '#8A2BE2', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  verifyButton: { backgroundColor: '#32CD32' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default UserRegisterScreen;
