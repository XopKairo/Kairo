import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Settings, Wallet, ShieldCheck, Heart, LogOut, ChevronRight, User as UserIcon, Crown, Gift, Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const UserProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  const fetchUserData = async () => {
    try {
      const storedUserStr = await AsyncStorage.getItem('userData');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        const response = await api.get(`/users/${storedUser._id || storedUser.id}`);
        setUser(response.data);
      }
    } catch (error) {
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${user._id || user.id}`);
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  /**
   * @param {{ icon: any, title: string, value?: string, onPress: any, color?: string }} props
   */
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
           <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statValue}>{user?.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>FOLLOWERS</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.following?.length || 0}</Text>
              <Text style={styles.statLabel}>FOLLOWING</Text>
           </View>
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
            onPress={handleDeleteAccount} 
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
  logoutBtn: { marginHorizontal: SPACING.lg, marginTop: 40, borderColor: 'rgba(255,75,75,0.3)' }
});

export default UserProfileScreen;
