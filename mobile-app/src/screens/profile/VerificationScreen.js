import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';



const VerificationScreen = () => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [idUrl, setIdUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // In a real app, you would use expo-image-picker here to let the user select/take photos.
  // For demonstration, we simulate selecting an image.
  const selectImage = (type) => {
    // Simulated image URLs
    const dummyUrl = `https://picsum.photos/300/400?random=${Math.random()}`;
    if (type === 'photo') setPhotoUrl(dummyUrl);
    if (type === 'id') setIdUrl(dummyUrl);
  };

  const submitVerification = async () => {
    if (!photoUrl || !idUrl) {
      Alert.alert('Error', 'Please upload both your selfie and ID photo.');
      return;
    }

    setLoading(true);
    try {
      // Assuming you store user info and token in AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user.id) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      const response = await api.post(`/verification/submit`, {
        userId: user.id,
        photoUrl,
        idUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Verification request submitted successfully. We will review it shortly.');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Get Verified</Text>
      <Text style={styles.subtitle}>Apply for your Blue Tick to build trust and get more visibility.</Text>

      <View style={styles.uploadSection}>
        <Text style={styles.label}>1. Take a Selfie</Text>
        <Text style={styles.instructions}>Make sure your face is clearly visible and well lit.</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => selectImage('photo')}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>+ Upload Selfie</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.label}>2. Upload ID</Text>
        <Text style={styles.instructions}>Upload a clear photo of your government-issued ID.</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => selectImage('id')}>
          {idUrl ? (
            <Image source={{ uri: idUrl }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>+ Upload ID</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={submitVerification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Submit Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  uploadSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  instructions: {
    fontSize: 14,
    color: '#777',
    marginBottom: 15,
  },
  uploadBox: {
    height: 150,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    fontSize: 16,
    color: '#888',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#99C2FF',
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default VerificationScreen;
