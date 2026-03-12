import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { Camera, ChevronLeft, CheckCircle2, Image as ImageIcon, Video as VideoIcon, Plus, X } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const EditProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState('');
  const [isVipOnly, setIsVipOnly] = useState(false);
  const [callRate, setCallRate] = useState('30');
  
  const [selfie, setSelfie] = useState(null);
  const [moments, setMoments] = useState([]);
  const [video, setVideo] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
        setName(userData.name || '');
        setGender(userData.gender || '');
        setBio(userData.bio || '');
        setAge(userData.age ? userData.age.toString() : '');
        
        // Data Sync: Display location from registration (State/District)
        const loc = userData.location || (userData.district && userData.state ? `${userData.district}, ${userData.state}` : userData.state || userData.district || '');
        setLocation(loc);

        // Data Sync: Languages
        if (userData.languages) {
           setLanguages(Array.isArray(userData.languages) ? userData.languages.join(', ') : userData.languages);
        }

        setIsVipOnly(userData.isVipOnly || false);
        setCallRate(userData.callRatePerMinute ? userData.callRatePerMinute.toString() : '30');
        if (userData.photos) setMoments(userData.photos.map(url => ({ uri: url, isRemote: true })));
      }
    } catch (error) {}
  };

  const pickMedia = async (type = 'image', isMoment = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || `${type}_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
          type: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg')
        };

        if (type === 'video') setVideo(file);
        else if (isMoment) setMoments([...moments, file]);
        else setSelfie(file);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('bio', bio);
      formData.append('age', age);
      formData.append('location', location);
      formData.append('languages', languages);
      formData.append('isVipOnly', isVipOnly ? 'true' : 'false');
      formData.append('callRatePerMinute', callRate);
      if (selfie) {
        // @ts-ignore
        formData.append('image', {
          uri: Platform.OS === 'android' ? selfie.uri : selfie.uri.replace('file://', ''),
          name: selfie.name || 'image.jpg',
          type: selfie.type || 'image/jpeg'
        });
      }

      if (video) {
        // @ts-ignore
        formData.append('video', {
          uri: Platform.OS === 'android' ? video.uri : video.uri.replace('file://', ''),
          name: video.name || 'video.mp4',
          type: video.type || 'video/mp4'
        });
      }

      if (moments.length > 0) {
        moments.forEach((m, index) => {
          if (m.uri && !m.isRemote) {
            // @ts-ignore
            formData.append('moments', {
              uri: Platform.OS === 'android' ? m.uri : m.uri.replace('file://', ''),
              name: `moment_${index}.jpg`,
              type: 'image/jpeg'
            });
          }
        });
      }
      const response = await api.put('user/auth/profile-update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        Alert.alert('Success', 'Profile updated!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Update Failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="#FFF" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE PROFILE</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.label}>Profile Cover</Text>
          <TouchableOpacity style={styles.mainUpload} onPress={() => pickMedia('image')}>
             {selfie || user?.profilePicture ? (
               <Image source={{ uri: selfie?.uri || user?.profilePicture }} style={styles.image} />
             ) : (
               <View style={styles.placeholder}>
                  <Camera color={COLORS.primary} size={40} />
                  <Text style={styles.uploadText}>Select Cover</Text>
               </View>
             )}
          </TouchableOpacity>

          <Text style={styles.label}>Moments (Gallery)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.momentsRow}>
             {moments.map((m, i) => (
               <View key={i} style={styles.momentItem}>
                  <Image source={{ uri: m.uri }} style={styles.momentImg} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => setMoments(moments.filter((_, idx) => idx !== i))}>
                     <X color="#FFF" size={12} />
                  </TouchableOpacity>
               </View>
             ))}
             {moments.length < 6 && (
               <TouchableOpacity style={styles.addMoment} onPress={() => pickMedia('image', true)}>
                  <Plus color={COLORS.textGray} size={30} />
               </TouchableOpacity>
             )}
          </ScrollView>

          <Text style={styles.label}>Short Video Preview</Text>
          <TouchableOpacity style={styles.videoUpload} onPress={() => pickMedia('video')}>
             {video || user?.shortVideoUrl ? (
               <View style={styles.videoPlaceholder}>
                  <VideoIcon color={COLORS.success} size={32} />
                  <Text style={{ color: COLORS.success, fontWeight: 'bold', marginTop: 5 }}>Video Selected</Text>
               </View>
             ) : (
               <View style={styles.placeholder}>
                  <VideoIcon color={COLORS.textGray} size={30} />
                  <Text style={styles.uploadText}>Upload Teaser</Text>
               </View>
             )}
          </TouchableOpacity>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Display Name" placeholderTextColor="#666" />

          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, { height: 80 }]} value={bio} onChangeText={setBio} multiline placeholder="Tell users about yourself..." placeholderTextColor="#666" />

          <Text style={styles.label}>Identity</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.activeGender]} onPress={() => setGender(g)}>
                <Text style={[styles.genderText, gender === g && { color: '#FFF' }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
             </View>
             <View style={{ flex: 2 }}>
                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" placeholderTextColor="#666" />
             </View>
          </View>

          <Text style={styles.label}>Languages</Text>
          <TextInput style={styles.input} value={languages} onChangeText={setLanguages} placeholder="E.g. English, Malayalam" placeholderTextColor="#666" />

          {user?.isHost && (
            <View style={styles.hostSettings}>
               <View style={styles.switchRow}>
                  <View>
                     <Text style={styles.label}>VIP Only Calls</Text>
                     <Text style={styles.hint}>Only VIP users can call you</Text>
                  </View>
                  <TouchableOpacity 
                     style={[styles.toggle, isVipOnly && { backgroundColor: COLORS.primary }]} 
                     onPress={() => setIsVipOnly(!isVipOnly)}
                  >
                     <View style={[styles.thumb, isVipOnly && { transform: [{ translateX: 20 }] }]} />
                  </TouchableOpacity>
               </View>

               <Text style={styles.label}>Call Rate (Coins/Min)</Text>
               <TextInput style={styles.input} value={callRate} onChangeText={setCallRate} keyboardType="numeric" />
            </View>
          )}

          <ZoraButton title="Update Changes" onPress={handleUpdate} loading={loading} style={{ marginTop: 20, marginBottom: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  content: { padding: 20 },
  label: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 15 },
  mainUpload: { width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  uploadText: { color: '#666', marginTop: 8, fontSize: 12 },
  momentsRow: { flexDirection: 'row', marginTop: 5 },
  momentItem: { width: 80, height: 100, borderRadius: 12, marginRight: 10, position: 'relative' },
  momentImg: { width: '100%', height: '100%', borderRadius: 12 },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, padding: 4 },
  addMoment: { width: 80, height: 100, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  videoUpload: { width: '100%', height: 80, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' },
  videoPlaceholder: { alignItems: 'center' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, color: '#FFF', fontSize: 16 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  activeGender: { backgroundColor: COLORS.primary },
  genderText: { color: '#666', fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  hostSettings: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  hint: { color: '#666', fontSize: 12 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#333', padding: 2 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' }
});

export default EditProfileScreen;
