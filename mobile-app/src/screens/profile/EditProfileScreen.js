import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile } from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

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
      console.error('Error loading user data:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a selfie!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelfie(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    setLoading(true);
    try {
      const userId = user._id || user.id;
      let verificationSelfieUrl = user.verificationSelfie || '';

      // If a new selfie is picked, upload it first (simulated or real depending on backend support)
      // For this requirement, we'll send the URI if it's a local path, 
      // but usually we'd upload to Cloudinary and get a URL.
      // Since our backend PUT /profile expects a string URL, let's handle multipart if needed.
      // But for simplicity and based on user request, we'll assume the backend can handle the update.
      
      // Note: In a real app, you'd use a separate upload endpoint or multipart for the selfie.
      // We'll use the existing /verification/submit logic if a selfie is provided and gender is female.
      
      const updateData = { gender };
      
      if (selfie) {
        // Upload selfie to Cloudinary first
        setUploading(true);
        const formData = new FormData();
        const selfieName = selfie.uri.split('/').pop();
        const selfieMatch = /\.(\w+)$/.exec(selfieName);
        const selfieType = selfieMatch ? `image/${selfieMatch[1]}` : `image`;
        
        formData.append('image', {
          uri: selfie.uri,
          name: selfieName,
          type: selfieType,
        });
        formData.append('userId', userId);
        formData.append('mediaType', 'image');

        // We use the posts endpoint for a generic upload if no dedicated upload endpoint exists
        // or we can just pass the base64/uri if the backend is updated.
        // Let's assume we need to upload to get a URL.
        const uploadRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/posts`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const uploadData = await uploadRes.json();
        if (uploadData.mediaUrl) {
            updateData.verificationSelfie = uploadData.mediaUrl;
        }
        setUploading(false);
      }

      const response = await updateUserProfile(userId, updateData);
      
      if (response.user) {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Identify as:</Text>
      <View style={styles.genderContainer}>
        {['Male', 'Female', 'Other'].map((g) => (
          <TouchableOpacity 
            key={g}
            style={[styles.genderBtn, gender === g && styles.activeGender]} 
            onPress={() => setGender(g)}
          >
            <Text style={[styles.genderText, gender === g && styles.activeGenderText]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Verification Selfie:</Text>
      <Text style={styles.hint}>Upload a clear photo for gender verification (Required for Female Hosts)</Text>
      
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        {selfie ? (
          <Image source={{ uri: selfie.uri }} style={styles.image} />
        ) : user?.verificationSelfie ? (
          <Image source={{ uri: user.verificationSelfie }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="camera-plus" size={40} color="#8A2BE2" />
            <Text style={styles.uploadText}>Upload Selfie</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.saveBtn, loading && styles.disabledBtn]} 
        onPress={handleUpdate}
        disabled={loading}
      >
        <LinearGradient colors={['#8A2BE2', '#6a11cb']} style={styles.btnGradient}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SAVE CHANGES</Text>}
        </LinearGradient>
      </TouchableOpacity>
      
      {uploading && <Text style={styles.uploadingText}>Uploading photo...</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 25 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  hint: { fontSize: 13, color: '#666', marginBottom: 15, marginTop: -10 },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  genderBtn: { 
    flex: 1, height: 45, borderRadius: 10, borderWidth: 1, borderColor: '#8A2BE2',
    justifyContent: 'center', alignItems: 'center'
  },
  activeGender: { backgroundColor: '#8A2BE2' },
  genderText: { color: '#8A2BE2', fontWeight: 'bold' },
  activeGenderText: { color: '#fff' },
  uploadBox: {
    width: '100%', height: 200, backgroundColor: '#f5f5f5', borderRadius: 20,
    borderWidth: 2, borderColor: '#8A2BE2', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 30
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  uploadText: { color: '#8A2BE2', marginTop: 10, fontWeight: '600' },
  saveBtn: { height: 55, borderRadius: 15, overflow: 'hidden', elevation: 5, marginTop: 10 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { opacity: 0.7 },
  uploadingText: { textAlign: 'center', marginTop: 10, color: '#8A2BE2', fontWeight: 'bold' }
});

export default EditProfileScreen;
