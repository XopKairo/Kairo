import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { ShieldCheck, Camera, FileText, Info, ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const VerificationScreen = ({ navigation }) => {
  const [selfie, setSelfie] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Camera roll access required.');

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const imagePayload = {
        uri: asset.uri,
        name: asset.fileName || `verify_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg'
      };
      if (type === 'selfie') setSelfie(imagePayload);
      else setIdProof(imagePayload);
    }
  };

  const submitVerification = async () => {
    if (!selfie || !idProof) return Alert.alert('Error', 'Please upload both images.');

    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('selfie', selfie);
      formData.append('idProof', idProof);

      const response = await api.post(`/verification/submit`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      Alert.alert('Success', 'Verification pending review.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
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
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  uploadText: { color: COLORS.textGray, marginTop: 10, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 8 },
  infoText: { color: COLORS.textGray, fontSize: 11 }
});

export default VerificationScreen;
