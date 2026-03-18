import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, SafeAreaView, StatusBar, Modal, Dimensions } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Settings, Wallet, ShieldCheck, Heart, LogOut, ChevronRight, User as UserIcon, Crown, Gift, Trash2, Camera, AlertTriangle, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const UserProfileScreen = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/user/auth/me');
      if (response.data) {
        setUser(response.data);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Fetch User Data Error:', error);
      const storedUserStr = await AsyncStorage.getItem('userData');
      if (storedUserStr) {
        setUser(JSON.parse(storedUserStr));
      }
    }
  };

  const processAccountDeletion = async () => {
    try {
      setDeleting(true);
      await api.delete('user/auth/delete-account');
      setDeleteModalVisible(false);
      await AsyncStorage.clear();
      navigation.replace('Login');
    } catch (err) {
      console.error(err);
      alert('Deletion failed. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const ProfileItem = ({ icon: Icon, title, value = null, onPress, color = COLORS.textWhite }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}><Icon color={color} size={20} /></View>
        <View>
          <Text style={styles.itemTitle}>{title}</Text>
          {value && <Text style={styles.itemValue}>{value}</Text>}
        </View>
      </View>
      <ChevronRight color={COLORS.textGray} size={18} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Image 
              size={100} 
              source={user?.profilePicture ? { uri: user.profilePicture } : require('../../../assets/icon.png')} 
              style={{ backgroundColor: COLORS.cardBackground }}
            />
            <View style={styles.editBadge}>
               <UserIcon color="#FFF" size={12} />
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'Loading...'}</Text>
          <Text style={styles.id}>ID: {user?._id?.substring(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.coins || 0}</Text>
              <Text style={styles.statLabel}>COINS</Text>
           </View>
           {user?.isHost && (
             <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
                <Text style={styles.statValue}>{user?.earnings || 0}</Text>
                <Text style={styles.statLabel}>EARNINGS</Text>
             </View>
           )}
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>FOLLOWERS</Text>
           </View>
           {!user?.isHost && (
             <View style={[styles.statBox, { borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
                <Text style={styles.statValue}>{user?.following?.length || 0}</Text>
                <Text style={styles.statLabel}>FOLLOWING</Text>
             </View>
           )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FINANCE</Text>
          <ProfileItem 
            icon={Wallet} 
            title="My Wallet" 
            value={`Balance: ${user?.coins || 0} Coins`} 
            onPress={() => navigation.navigate('Wallet')} 
            color={COLORS.accentGlow}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREMIUM FEATURES</Text>
          {!user?.isHost && (
            <ProfileItem 
              icon={Camera} 
              title="Become a Host" 
              value="Earn coins by receiving calls"
              onPress={() => navigation.navigate('HostRegistration')} 
              color={COLORS.primary}
            />
          )}
          <ProfileItem 
            icon={Crown} 
            title="VIP Club" 
            value={user?.isVip ? `Active: ${user.vipLevel}` : 'Join VIP'} 
            onPress={() => navigation.navigate('VIP')} 
            color="#FCD34D"
          />
          <ProfileItem 
            icon={Gift} 
            title="Scratch & Win" 
            onPress={() => navigation.navigate('ScratchCard')} 
            color={COLORS.primary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <ProfileItem 
            icon={Settings} 
            title="Account Settings" 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          <ProfileItem 
            icon={ShieldCheck} 
            title="Verification Status" 
            value={user?.isGenderVerified ? 'Premium Verified' : 'Unverified'} 
            onPress={() => navigation.navigate('Verification')} 
            color={user?.isGenderVerified ? COLORS.success : COLORS.error}
          />
          <ProfileItem 
            icon={Heart} 
            title="My Interests" 
            onPress={() => navigation.navigate('SelectInterests')} 
          />
          <ProfileItem 
            icon={Trash2} 
            title="Delete Account" 
            onPress={() => setDeleteModalVisible(true)} 
            color={COLORS.error}
          />
        </View>

        <ZoraButton 
          title="Sign Out" 
          variant="outline" 
          style={styles.logoutBtn} 
          loading={false}
          onPress={async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          }}
        />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Supreme Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
         <View style={styles.modalOverlay}>
            <LinearGradient colors={['rgba(30,20,50,0.95)', '#0F0A19']} style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <View style={styles.warningCircle}>
                     <AlertTriangle color="#FF4B4B" size={32} />
                  </View>
                  <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.closeBtn}>
                     <X color="#999" size={24} />
                  </TouchableOpacity>
               </View>

               <Text style={styles.modalTitle}>PURGE ACCOUNT?</Text>
               <Text style={styles.modalDesc}>
                  This is a permanent action. All your digital footprint, including coins, history, and host data will be <Text style={{ color: '#FF4B4B', fontWeight: 'bold' }}>permanently wiped</Text> from Kairo OS.
               </Text>

               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setDeleteModalVisible(false)}>
                     <Text style={styles.cancelBtnText}>KEEP ACCOUNT</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.deleteModalBtn, deleting && { opacity: 0.5 }]} 
                    onPress={processAccountDeletion}
                    disabled={deleting}
                  >
                     <LinearGradient colors={['#FF4B4B', '#A50000']} style={styles.deleteGradient}>
                        <Text style={styles.deleteBtnText}>{deleting ? 'PURGING...' : 'DELETE EVERYTHING'}</Text>
                     </LinearGradient>
                  </TouchableOpacity>
               </View>
            </LinearGradient>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { alignItems: 'center', paddingVertical: 40 },
  avatarContainer: { position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.backgroundDark },
  name: { color: COLORS.textWhite, fontSize: 24, fontWeight: '900', marginTop: 15 },
  id: { color: COLORS.textGray, fontSize: 12, marginTop: 4, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.cardBackground, marginHorizontal: SPACING.lg, borderRadius: 20, paddingVertical: 20, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: COLORS.textWhite, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.textGray, fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  section: { marginTop: 30, paddingHorizontal: SPACING.lg },
  sectionLabel: { color: COLORS.textGray, fontSize: 12, fontWeight: '900', marginBottom: 15, marginLeft: 10, letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBackground, padding: 16, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemTitle: { color: COLORS.textWhite, fontSize: 15, fontWeight: '600' },
  itemValue: { color: COLORS.textGray, fontSize: 12, marginTop: 2 },
  logoutBtn: { marginHorizontal: SPACING.lg, marginTop: 40, borderColor: 'rgba(255,75,75,0.3)' },
  
  // Advanced Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 32, p: 30, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  warningCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,75,75,0.1)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { padding: 5 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  modalDesc: { color: COLORS.textGray, fontSize: 14, lineHeight: 22, marginBottom: 30 },
  modalActions: { gap: 12 },
  cancelModalBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  cancelBtnText: { color: '#999', fontSize: 14, fontWeight: 'bold' },
  deleteModalBtn: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden' },
  deleteGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});

export default UserProfileScreen;
