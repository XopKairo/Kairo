import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Modal
} from 'react-native';
import { ChevronLeft, Camera, Calendar, MapPin, Globe, ChevronDown, Check } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';
import ZoraAlert from '../../components/ZoraAlert';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { LOCATIONS } from '../../constants/locations';

const UserRegisterScreen = ({ route, navigation }) => {
  const { mobileNumber, otpToken } = route.params;
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return showAlert('Permission Required', 'We need gallery access to pick a profile picture.');
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePic(result.assets[0].uri);
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick image');
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) return showAlert('Error', 'Please enter your full name');
    if (!profilePic) return showAlert('Error', 'Please select a profile picture');
    if (!day || !month || !year) return showAlert('Error', 'Please select your Date of Birth');
    if (!state || !district) return showAlert('Error', 'Please select your Location');
    if (!gender) return showAlert('Error', 'Please select your Gender');

    setLoading(true);
    try {
        const dob = new Date(`${year}-${month}-${day}`);
        const additionalData = {
           profilePicture: profilePic,
           dob: dob.toISOString(),
           state,
           district,
           gender,
           languages
        };

        const response = await signUp(name.trim(), mobileNumber, null, otpToken, additionalData);
        if (response.success) {
           navigation.replace('Welcome');
        } else {
           showAlert('Registration Failed', response.message || 'Please check your details');
        }
    } catch (error) {
      showAlert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderLocationModal = () => (
    <Modal visible={showLocationModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Location</Text>
          <ScrollView>
            {Object.keys(LOCATIONS).map(s => (
              <View key={s} style={{ marginBottom: 15 }}>
                <Text style={styles.stateHeader}>{s}</Text>
                <View style={styles.districtGrid}>
                  {LOCATIONS[s].map(d => (
                    <TouchableOpacity 
                      key={d} 
                      style={[styles.districtChip, district === d && styles.districtChipActive]}
                      onPress={() => { setState(s); setDistrict(d); setShowLocationModal(false); }}
                    >
                      <Text style={[styles.districtText, district === d && styles.districtTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <ZoraButton title="Close" onPress={() => setShowLocationModal(false)} variant="outline" style={{ marginTop: 15 }} />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ZoraAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft color={COLORS.textWhite} size={28} />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Complete Profile</Text>
            <Text style={styles.subtitle}>Set up your identity</Text>
          </View>

          <View style={styles.profilePicContainer}>
            <TouchableOpacity style={styles.picWrapper} onPress={pickImage}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.image} />
              ) : (
                <View style={styles.picPlaceholder}>
                  <Camera color={COLORS.primary} size={32} />
                  <Text style={styles.picText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <ZoraInput label="Full Name" value={name} onChangeText={setName} placeholder="Display Name" />

            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.dobRow}>
              <ZoraInput value={day} onChangeText={setDay} placeholder="DD" keyboardType="numeric" maxLength={2} style={{ flex: 1 }} />
              <ZoraInput value={month} onChangeText={setMonth} placeholder="MM" keyboardType="numeric" maxLength={2} style={{ flex: 1, marginHorizontal: 10 }} />
              <ZoraInput value={year} onChangeText={setYear} placeholder="YYYY" keyboardType="numeric" maxLength={4} style={{ flex: 1.5 }} />
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map(g => (
                <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.pickerField} onPress={() => setShowLocationModal(true)}>
              <View style={styles.pickerLeft}>
                <MapPin size={20} color={COLORS.primary} />
                <Text style={styles.pickerText}>{district ? `${district}, ${state}` : 'Select Location'}</Text>
              </View>
              <ChevronDown size={20} color={COLORS.textGray} />
            </TouchableOpacity>

            <ZoraButton title="Register Account" onPress={handleRegister} loading={loading} style={{ marginTop: 20 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {renderLocationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, zIndex: 10, width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, padding: SPACING.lg, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 60 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textWhite, marginBottom: 8 },
  subtitle: { color: COLORS.textGray, fontSize: 16 },
  profilePicContainer: { alignItems: 'center', marginBottom: 30 },
  picWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.cardBackground, borderWidth: 2, borderColor: COLORS.primary, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  picPlaceholder: { alignItems: 'center' },
  picText: { color: COLORS.textGray, fontSize: 12, marginTop: 5 },
  formCard: { backgroundColor: COLORS.cardBackground, padding: SPACING.xl, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  label: { color: COLORS.textWhite, fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  dobRow: { flexDirection: 'row' },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genderBtn: { flex: 1, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  genderBtnActive: { backgroundColor: COLORS.primary },
  genderBtnText: { color: COLORS.textGray, fontWeight: 'bold' },
  genderBtnTextActive: { color: COLORS.textWhite },
  pickerField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, marginTop: 10 },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { color: COLORS.textWhite, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '80%' },
  modalTitle: { color: COLORS.textWhite, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  stateHeader: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16, marginBottom: 10, marginTop: 10 },
  districtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  districtChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  districtChipActive: { backgroundColor: 'rgba(108, 43, 217, 0.2)', borderColor: COLORS.primary },
  districtText: { color: COLORS.textGray, fontSize: 12 },
  districtTextActive: { color: COLORS.textWhite, fontWeight: 'bold' }
});

export default UserRegisterScreen;
