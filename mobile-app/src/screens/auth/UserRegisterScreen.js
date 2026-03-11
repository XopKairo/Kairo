import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Modal
} from 'react-native';
import { ChevronLeft, Camera, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { registerUser } from '../../services/api';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import ZoraInput from '../../components/ZoraInput';
import ZoraAlert from '../../components/ZoraAlert';
import { useAuth } from '../../context/AuthContext';
import { statesAndDistricts, statesList } from '../../constants/locations';

// Helper component for Dropdown
const ZoraDropdown = ({ label, value, options, onSelect, placeholder }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdownBtn} 
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.dropdownBtnText, !value && { color: COLORS.textGray }]}>
          {value || placeholder}
        </Text>
        <ChevronDown color={COLORS.textGray} size={20} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(opt);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const UserRegisterScreen = ({ route, navigation }) => {
  const { mobileNumber, otpToken } = route.params || {};
  const { signUp } = useAuth();
  
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  
  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };
  
  // DOB States
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  
  // Location States
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  
  // Gender State
  const [gender, setGender] = useState('');
  
  // Languages State
  const [languages, setLanguages] = useState([]);

  const [loading, setLoading] = useState(false);

  // Lists for Pickers
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 100}, (_, i) => (currentYear - i).toString());
  const genderOptions = ['Male', 'Female', 'Other'];
  const languageOptions = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'];

  const toggleLanguage = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      // Create data URI from base64
      const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfilePic(uri);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) return showAlert('Error', 'Please enter your full name');
    if (!profilePic) return showAlert('Error', 'Please select a profile picture');
    if (!day || !month || !year) return showAlert('Error', 'Please select your full Date of Birth');
    if (!state || !district) return showAlert('Error', 'Please select your Location (State and District)');
    if (!gender) return showAlert('Error', 'Please select your Gender');

    const dob = new Date(`${year}-${month}-${day}`);

    setLoading(true);
    try {
        const additionalData = {
           profilePicture: profilePic,
           dob: dob.toISOString(),
           state,
           district,
           gender,
           languages
        };

        const response = await signUp(
          name.trim(), 
          mobileNumber, 
          null, // No password
          otpToken,
          additionalData
        );
        
        if (response.success) {
           navigation.replace('Welcome');
        }
    } catch (error) {
      showAlert('Registration Failed', error.message || 'Check your details and try again');
    } finally {
      setLoading(false);
    }
  };

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Complete Profile</Text>
            <Text style={styles.subtitle}>Let's set up your identity</Text>
          </View>

          <View style={styles.formCard}>
             
             {/* Profile Picture */}
             <View style={styles.picContainer}>
                <TouchableOpacity onPress={pickImage} style={styles.picWrapper}>
                   {profilePic ? (
                      <Image source={{ uri: profilePic }} style={styles.profileImg} />
                   ) : (
                      <View style={styles.placeholderImg}>
                         <Camera color={COLORS.textGray} size={32} />
                      </View>
                   )}
                   <View style={styles.editBadge}>
                      <Text style={styles.editBadgeText}>+</Text>
                   </View>
                </TouchableOpacity>
                <Text style={styles.picHint}>Add a clear photo of yourself</Text>
             </View>

             <ZoraInput label="Full Name" placeholder="Your real name" value={name} onChangeText={setName} />
             
             {/* Gender */}
             <ZoraDropdown 
                label="Gender" 
                value={gender} 
                options={genderOptions} 
                onSelect={setGender} 
                placeholder="Select Gender" 
             />

             {/* Date of Birth */}
             <Text style={styles.label}>Date of Birth</Text>
             <View style={styles.row}>
                <View style={{flex: 1, marginRight: 5}}>
                  <ZoraDropdown label="" value={day} options={days} onSelect={setDay} placeholder="DD" />
                </View>
                <View style={{flex: 1, marginHorizontal: 5}}>
                  <ZoraDropdown label="" value={month} options={months} onSelect={setMonth} placeholder="MM" />
                </View>
                <View style={{flex: 1.5, marginLeft: 5}}>
                  <ZoraDropdown label="" value={year} options={years} onSelect={setYear} placeholder="YYYY" />
                </View>
             </View>

             {/* Location */}
             <ZoraDropdown 
                label="State" 
                value={state} 
                options={statesList} 
                onSelect={(val) => { setState(val); setDistrict(''); }} 
                placeholder="Select State" 
             />
             
             {state ? (
               <ZoraDropdown 
                  label="District" 
                  value={district} 
                  options={statesAndDistricts[state] || []} 
                  onSelect={setDistrict} 
                  placeholder="Select District" 
               />
             ) : null}

             {/* Languages */}
             <Text style={styles.label}>Languages Known</Text>
             <View style={styles.languagesContainer}>
               {languageOptions.map((lang, idx) => (
                 <TouchableOpacity 
                   key={idx} 
                   style={[styles.langChip, languages.includes(lang) && styles.langChipActive]}
                   onPress={() => toggleLanguage(lang)}
                 >
                   <Text style={[styles.langChipText, languages.includes(lang) && styles.langChipTextActive]}>
                     {lang}
                   </Text>
                 </TouchableOpacity>
               ))}
             </View>

             <ZoraButton title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: 20 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  backBtn: {
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textWhite,
  },
  subtitle: {
    color: COLORS.textGray,
    fontSize: 16,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  picContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  picWrapper: {
    position: 'relative',
  },
  profileImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  placeholderImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  editBadgeText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: -2,
  },
  picHint: {
    color: COLORS.textGray,
    fontSize: 12,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 56,
    paddingHorizontal: 16,
  },
  dropdownBtnText: {
    color: COLORS.textWhite,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionText: {
    color: COLORS.textWhite,
    fontSize: 16,
    textAlign: 'center',
  },
  modalCloseBtn: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(108, 43, 217, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.accentGlow,
    fontWeight: 'bold',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  langChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  langChipActive: {
    backgroundColor: 'rgba(108, 43, 217, 0.2)',
    borderColor: COLORS.primary,
  },
  langChipText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  langChipTextActive: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  }
});

export default UserRegisterScreen;
