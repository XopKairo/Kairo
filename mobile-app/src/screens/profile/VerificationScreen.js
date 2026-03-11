import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { ShieldCheck, Camera, FileText, Info, ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraAlert from '../../components/ZoraAlert';

const VerificationScreen = ({ navigation }) => {
  const [selfie, setSelfie] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera roll access is required.');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imagePayload = {
          uri: asset.uri,
          name: asset.fileName || `verify_${type}_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg'
        };
        if (type === 'selfie') setSelfie(imagePayload);
        else setIdProof(imagePayload);
      }
    } catch (err) {
      showAlert('Error', 'Failed to pick image');
    }
  };

  const submitVerification = async () => {
    if (!selfie || !idProof) return showAlert('Error', 'Please upload both images.');

    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      const formData = new FormData();
      formData.append('userId', userId);
      
      // @ts-ignore
      formData.append('selfie', {
        uri: Platform.OS === 'android' ? selfie.uri : selfie.uri.replace('file://', ''),
        name: selfie.name || 'selfie.jpg',
        type: selfie.type || 'image/jpeg'
      });

      // @ts-ignore
      formData.append('idProof', {
        uri: Platform.OS === 'android' ? idProof.uri : idProof.uri.replace('file://', ''),
        name: idProof.name || 'idproof.jpg',
        type: idProof.type || 'image/jpeg'
      });

      const response = await api.post('verification/submit', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      showAlert('Success', 'Verification pending review.', 'success');
      setTimeout(() => navigation.goBack(), 2000);
    } catch (error) {
      console.error('Verification Error:', error.response?.data || error.message);
      showAlert('Error', error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ZoraAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color={COLORS.textWhite} size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>VERIFICATION</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <ShieldCheck color={COLORS.accentGlow} size={60} />
          <Text style={styles.title}>Elite Host Verification</Text>
          <Text style={styles.subtitle}>Unlock earnings and premium profile status.</Text>
        </View>

        <Text style={styles.label}>1. Live Selfie</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('selfie')}>
          {selfie ? <Image source={{ uri: selfie.uri }} style={styles.image} /> : (
            <View style={styles.placeholder}><Camera color={COLORS.primary} size={32} /><Text style={styles.uploadText}>Upload Selfie</Text></View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>2. Government ID</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('id')}>
          {idProof ? <Image source={{ uri: idProof.uri }} style={styles.image} /> : (
            <View style={styles.placeholder}><FileText color={COLORS.primary} size={32} /><Text style={styles.uploadText}>Upload ID Proof</Text></View>
          )}
        </TouchableOpacity>

        <ZoraButton title="Submit for Review" onPress={submitVerification} loading={loading} style={{ marginTop: 20 }} />
        
        <View style={styles.infoBox}>
          <Info color={COLORS.textGray} size={16} />
          <Text style={styles.infoText}>Data is encrypted and used only for ID verification.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  headerTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: SPACING.lg },
  intro: { alignItems: 'center', marginBottom: 40 },
  title: { color: COLORS.textWhite, fontSize: 24, fontWeight: '900', marginTop: 15 },
  subtitle: { color: COLORS.textGray, fontSize: 14, textAlign: 'center', marginTop: 8 },
  label: { color: COLORS.textWhite, fontSize: 16, fontWeight: '700', marginBottom: 15, marginTop: 20 },
  uploadBox: { height: 180, backgroundColor: COLORS.cardBackground, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  uploadText: { color: COLORS.textGray, marginTop: 10, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 8 },
  infoText: { color: COLORS.textGray, fontSize: 11 }
});

export default VerificationScreen;
