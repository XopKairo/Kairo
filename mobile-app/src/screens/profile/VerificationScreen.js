import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { ShieldCheck, Camera as CameraIcon, FileText, Info, ChevronLeft, RotateCcw, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import ZoraButton from '../../components/ZoraButton';
import ZoraAlert from '../../components/ZoraAlert';

const { width } = Dimensions.get('window');

const VerificationScreen = ({ navigation }) => {
  const [selfie, setSelfie] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error', buttons = []) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const handleCapture = async (type) => {
    showAlert(
      'Verify Image Source',
      `Choose how you want to upload your ${type === 'selfie' ? 'selfie' : 'ID proof'}.`,
      'notice',
      [
        { text: 'CAMERA', onPress: () => openPicker(type, 'camera') },
        { text: 'GALLERY', onPress: () => openPicker(type, 'gallery') },
        { text: 'CANCEL', style: 'cancel' }
      ]
    );
  };

  const openPicker = async (type, mode) => {
    try {
      const permission = mode === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync() 
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        showAlert('Permission Denied', `${mode} access is required.`);
        return;
      }

      const options = {
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      };

      const result = mode === 'camera' 
        ? await ImagePicker.launchCameraAsync(options) 
        : await ImagePicker.launchImageLibraryAsync(options);

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
      showAlert('Error', 'Failed to capture image');
    }
  };

  const submitVerification = async () => {
    if (!selfie || !idProof) return showAlert('Files Missing', 'Both selfie and ID proof are mandatory for verification.');

    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      const formData = new FormData();
      formData.append('userId', userId);
      
      formData.append('selfie', {
        uri: Platform.OS === 'android' ? selfie.uri : selfie.uri.replace('file://', ''),
        name: selfie.name || 'selfie.jpg',
        type: selfie.type || 'image/jpeg'
      });

      formData.append('idProof', {
        uri: Platform.OS === 'android' ? idProof.uri : idProof.uri.replace('file://', ''),
        name: idProof.name || 'idproof.jpg',
        type: idProof.type || 'image/jpeg'
      });

      await api.post('user/verification', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      showAlert('Application Submitted', 'Admin will review your documents within 24 hours.', 'success');
      setTimeout(() => navigation.navigate('Main'), 2500);
    } catch (error) {
      showAlert('Submission Failed', error.response?.data?.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const UploadSlot = ({ type, data, onSelect }) => (
    <View style={styles.slotWrapper}>
      <Text style={styles.label}>{type === 'selfie' ? '1. LIVE SELFIE' : '2. GOVERNMENT ID'}</Text>
      <TouchableOpacity 
        style={[styles.uploadBox, data && styles.uploadedBox]} 
        onPress={() => !data && onSelect(type)}
        activeOpacity={0.9}
      >
        {data ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: data.uri }} style={styles.image} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.previewOverlay}>
               <TouchableOpacity style={styles.retakeBtn} onPress={() => onSelect(type)}>
                  <RotateCcw color="#FFF" size={16} />
                  <Text style={styles.retakeText}>RETAKE</Text>
               </TouchableOpacity>
               <View style={styles.confirmedBadge}>
                  <Check color="#FFF" size={14} />
                  <Text style={styles.confirmedText}>READY</Text>
               </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconCircle}>
               {type === 'selfie' ? <CameraIcon color={COLORS.primary} size={32} /> : <FileText color={COLORS.primary} size={32} />}
            </View>
            <Text style={styles.uploadText}>TAP TO CAPTURE</Text>
            <Text style={styles.hintText}>{type === 'selfie' ? 'Face must be clearly visible' : 'ID details must be readable'}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ZoraAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ChevronLeft color="#FFF" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>SUPREME VERIFICATION</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <ShieldCheck color={COLORS.accentGlow} size={50} />
          <View>
             <Text style={styles.title}>Identity Sync</Text>
             <Text style={styles.subtitle}>Our AI + Admin team verifies every host.</Text>
          </View>
        </View>

        <UploadSlot type="selfie" data={selfie} onSelect={handleCapture} />
        <UploadSlot type="id" data={idProof} onSelect={handleCapture} />

        <View style={styles.warningBox}>
           <AlertTriangle color="#F59E0B" size={20} />
           <Text style={styles.warningText}>Ensure lighting is good. Blurry photos will be literal rejected by the system.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitMain, (!selfie || !idProof || loading) && styles.submitDisabled]} 
          onPress={submitVerification}
          disabled={!selfie || !idProof || loading}
        >
           <LinearGradient 
             colors={(!selfie || !idProof) ? ['#333', '#222'] : [COLORS.primary, '#4C1D95']} 
             style={styles.submitGradient}
             start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
           >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>FINALIZE & SUBMIT</Text>}
           </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.footerInfo}>Encrypted Secure Tunnel Enabled</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20 },
  introCard: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  subtitle: { color: COLORS.textGray, fontSize: 12, marginTop: 4 },
  slotWrapper: { marginBottom: 25 },
  label: { color: '#FFF', fontSize: 12, fontWeight: '900', marginBottom: 15, letterSpacing: 1, opacity: 0.6 },
  uploadBox: { height: 220, backgroundColor: COLORS.cardBackground, borderRadius: 32, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)', borderStyle: 'dashed' },
  uploadedBox: { borderStyle: 'solid', borderColor: COLORS.primary },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewContainer: { width: '100%', height: '100%' },
  previewOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  retakeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 15 },
  confirmedText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  placeholder: { alignItems: 'center' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(108, 43, 217, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  uploadText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  hintText: { color: COLORS.textGray, fontSize: 11, marginTop: 6 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: 15, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)' },
  warningText: { color: '#F59E0B', flex: 1, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  submitMain: { height: 64, borderRadius: 24, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  submitGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  submitDisabled: { opacity: 0.5 },
  footerInfo: { color: COLORS.textGray, textAlign: 'center', fontSize: 10, marginTop: 20, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});

export default VerificationScreen;
