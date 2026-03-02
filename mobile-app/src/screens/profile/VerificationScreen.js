import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const VerificationScreen = ({ navigation }) => {
  const [selfie, setSelfie] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      if (type === 'selfie') setSelfie(result.assets[0]);
      else setIdProof(result.assets[0]);
    }
  };

  const submitVerification = async () => {
    if (!selfie || !idProof) {
      Alert.alert('Error', 'Please upload both your selfie and ID photo.');
      return;
    }

    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      // Prepare FormData for upload
      const formData = new FormData();
      formData.append('userId', userId);
      
      // Add Selfie
      const selfieName = selfie.uri.split('/').pop();
      const selfieMatch = /\.(\w+)$/.exec(selfieName);
      const selfieType = selfieMatch ? `image/${selfieMatch[1]}` : `image`;
      formData.append('selfie', {
        uri: selfie.uri,
        name: selfieName,
        type: selfieType,
      });

      // Add ID Proof
      const idName = idProof.uri.split('/').pop();
      const idMatch = /\.(\w+)$/.exec(idName);
      const idType = idMatch ? `image/${idMatch[1]}` : `image`;
      formData.append('idProof', {
        uri: idProof.uri,
        name: idName,
        type: idType,
      });

      await api.post(`/verification/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Verification request submitted successfully. Our team will review it within 24-48 hours.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Verification error:', error);
      const msg = error.response?.data?.message || 'Failed to submit verification request.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Icon name="shield-check" size={60} color="#8A2BE2" />
        <Text style={styles.title}>Host Verification</Text>
        <Text style={styles.subtitle}>Complete verification to unlock earnings and withdrawal features.</Text>
      </View>

      <View style={styles.uploadSection}>
        <View style={styles.sectionHeader}>
            <Icon name="account-circle" size={24} color="#333" />
            <Text style={styles.label}>1. Live Selfie</Text>
        </View>
        <Text style={styles.instructions}>Please upload a clear, front-facing selfie of yourself.</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('selfie')}>
          {selfie ? (
            <Image source={{ uri: selfie.uri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
                <Icon name="camera" size={30} color="#888" />
                <Text style={styles.uploadText}>Upload Selfie</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.uploadSection}>
        <View style={styles.sectionHeader}>
            <Icon name="card-account-details" size={24} color="#333" />
            <Text style={styles.label}>2. Government ID</Text>
        </View>
        <Text style={styles.instructions}>Aadhaar Card, PAN Card, or Driving License.</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('id')}>
          {idProof ? (
            <Image source={{ uri: idProof.uri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
                <Icon name="file-document" size={30} color="#888" />
                <Text style={styles.uploadText}>Upload ID Proof</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, (loading || !selfie || !idProof) && styles.submitButtonDisabled]} 
        onPress={submitVerification}
        disabled={loading || !selfie || !idProof}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Submit for Verification</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
          <Icon name="information-outline" size={20} color="#666" />
          <Text style={styles.infoText}>Your data is stored securely and only used for identity verification.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 5, paddingHorizontal: 10 },
  uploadSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  instructions: { fontSize: 14, color: '#777', marginBottom: 15 },
  uploadBox: {
    height: 160,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: { alignItems: 'center' },
  uploadText: { fontSize: 14, color: '#888', marginTop: 5, fontWeight: '500' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitButton: {
    backgroundColor: '#8A2BE2',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 4,
  },
  submitButtonDisabled: { backgroundColor: '#C084FC' },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, paddingHorizontal: 10 },
  infoText: { fontSize: 12, color: '#666', marginLeft: 5, textAlign: 'center' }
});

export default VerificationScreen;
