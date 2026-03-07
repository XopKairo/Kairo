import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { Camera, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const EditProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [gender, setGender] = useState('');
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
        setGender(userData.gender || '');
      }
    } catch (error) {
      console.error('Load User Error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is required to update profile picture.');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Newer Expo syntax
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected Image:', asset.uri);
        setSelfie({
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg'
        });
      }
    } catch (err) {
      console.error('Pick Image Error:', err);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleUpdate = async () => {
    if (!gender) return Alert.alert('Error', 'Please select your gender');

    setLoading(true);
    try {
      const userId = user._id || user.id;
      const formData = new FormData();
      formData.append('gender', gender);
      
      if (selfie) {
        setUploading(true);
        formData.append('image', {
          uri: Platform.OS === 'android' ? selfie.uri : selfie.uri.replace('file://', ''),
          name: selfie.name,
          type: selfie.type
        });
      }

      const response = await api.put(`/users/${userId}/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        // Important: Update local storage with new user data including photo URL
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update error details:', error.response?.data || error.message);
      Alert.alert('Update Failed', error.response?.data?.message || 'Check your internet connection.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textWhite} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Identity</Text>
        <View style={styles.genderRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity 
              key={g}
              style={[styles.genderBtn, gender === g && styles.activeGender]} 
              onPress={() => setGender(g)}
            >
              {gender === g && <CheckCircle2 size={14} color="#FFF" style={{marginRight: 6}} />}
              <Text style={[styles.genderText, gender === g && { color: '#FFF' }]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Profile Picture / Selfie</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          {selfie ? (
            <Image source={{ uri: selfie.uri }} style={styles.image} />
          ) : user?.profilePicture || user?.verificationSelfie ? (
            <Image source={{ uri: user.profilePicture || user.verificationSelfie }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Camera color={COLORS.primary} size={40} />
              <Text style={styles.uploadText}>Select Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <ZoraButton title="Save Profile" onPress={handleUpdate} loading={loading || uploading} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  headerTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: SPACING.lg },
  label: { color: COLORS.textWhite, fontSize: 16, fontWeight: '700', marginBottom: 15, marginTop: 10 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  genderBtn: { flex: 1, height: 50, borderRadius: 15, backgroundColor: COLORS.cardBackground, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)', flexDirection: 'row' },
  activeGender: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.textGray, fontWeight: 'bold' },
  uploadBox: { width: '100%', height: 250, backgroundColor: COLORS.cardBackground, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  uploadText: { color: COLORS.textGray, marginTop: 10, fontWeight: '600' }
});

export default EditProfileScreen;
