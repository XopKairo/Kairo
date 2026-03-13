import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Modal } from 'react-native';
import { Avatar, Card, IconButton } from 'react-native-paper';
import { ShieldCheck, MapPin, Globe2, MessageCircle, Phone, Heart, Share2, MoreVertical, ChevronLeft, ShieldAlert, Star, Play, Ban } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const HostProfileScreen = ({ route, navigation }) => {
  const { hostId: routeHostId, hostData: initialData } = route.params || {};
  const { user: currentUser, showAlert } = useAuth();
  const [host, setHost] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchHostDetails();
  }, [routeHostId]);

  const fetchHostDetails = async () => {
    const targetId = routeHostId || initialData?._id;
    if (!targetId) return;
    try {
      const res = await api.get(`public/hosts/${targetId}`);
      if (res.data) {
        setHost(res.data);
        if (currentUser && res.data.userId) {
           setIsFollowing(currentUser.following?.includes(res.data.userId?._id || res.data.userId));
        }
      }
    } catch (error) {
      console.error('Fetch Host Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return navigation.navigate('Login');
    try {
      const targetId = host.userId?._id || host.userId;
      const res = await api.post(`users/follow/${targetId}`);
      setIsFollowing(res.data.following);
    } catch (e) {}
  };

  const handleCall = () => {
    if (!currentUser) return navigation.navigate('Login');
    
    if (host?.isVipOnly && !currentUser?.isVip) {
      showAlert(
        'VIP Feature', 
        'This host accepts calls from VIP members only. Join VIP Club to connect!', 
        'notice',
        'LATER',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'JOIN VIP', onPress: () => navigation.navigate('VIP') }
        ]
      );
      return;
    }

    navigation.navigate('VideoCall', {
      userId: currentUser._id || currentUser.id,
      userName: currentUser.name,
      hostId: host._id,
      hostName: host.name,
      callId: `call_${Date.now()}`,
      callRatePerMinute: host.callRatePerMinute || 30
    });
  };

  const handleBlock = () => {
    showAlert(
      'Block User', 
      'Are you sure you want to block this user?', 
      'error',
      'CANCEL',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'BLOCK', 
          onPress: async () => {
            try {
              const targetId = host.userId?._id || host.userId;
              await api.post(`users/block/${targetId}`);
              showAlert('Success', 'User has been blocked.', 'success');
              navigation.goBack();
            } catch (e) {
              showAlert('Error', 'Failed to block user');
            }
          } 
        }
      ]
    );
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!host) return <View style={styles.container}><Text style={{ color: '#FFF' }}>Host not found</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" transparent />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
           <Image source={{ uri: host.profilePicture }} style={styles.coverImg} />
           <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(15,10,25,1)']} style={styles.gradient} />
           
           <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ChevronLeft color="#FFF" size={28} />
           </TouchableOpacity>

           <View style={styles.coverBadge}>
              <View style={[styles.statusDot, { backgroundColor: host.status === 'Online' ? '#10B981' : host.status === 'Busy' ? '#F59E0B' : '#666' }]} />
              <Text style={styles.statusText}>{host.status}</Text>
           </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
           <View style={styles.nameRow}>
              <View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.nameText}>{host.name}</Text>
                    {host.isVerified && <ShieldCheck color="#10B981" size={20} fill="#10B981" />}
                 </View>
                 <Text style={styles.idText}>ID: #{host.hostId || 'PENDING'}</Text>
              </View>
              <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]} onPress={handleFollow}>
                 <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
           </View>

           <View style={styles.statsBar}>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.totalCalls || 0}</Text><Text style={styles.statLabel}>Calls</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.avgRating?.toFixed(1) || '0.0'}</Text><Text style={styles.statLabel}>Rating</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.callRatePerMinute || 30}</Text><Text style={styles.statLabel}>Coins/m</Text></View>
           </View>

           <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <Text style={styles.bioText}>{host.bio || `Hi, I am ${host.name}. Let's connect and have a good time!`}</Text>
              
              <View style={styles.infoGrid}>
                 <View style={styles.infoItem}><MapPin color={COLORS.textGray} size={14} /><Text style={styles.infoValue}>{host.location || 'India'}</Text></View>
                 <View style={styles.infoItem}><Globe2 color={COLORS.textGray} size={14} /><Text style={styles.infoValue}>{Array.isArray(host.languages) ? host.languages.join(', ') : host.languages || 'English'}</Text></View>
              </View>
           </section>

           <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <FlatList data={host.photos || [host.profilePicture]} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item, i) => i.toString()} renderItem={({ item }) => (
                 <TouchableOpacity style={styles.galleryItem}>
                    <Image source={{ uri: item }} style={styles.galleryImg} />
                 </TouchableOpacity>
              )} />
           </View>

           <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.circleBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={handleBlock}><Ban color="#FF4B4B" size={22} /></TouchableOpacity>
              <TouchableOpacity style={styles.circleBtn} onPress={() => showAlert('Shared', 'Profile link copied to clipboard!', 'success')}><Share2 color="#FFF" size={22} /></TouchableOpacity>
              <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { recipient: host })}><MessageCircle color="#FFF" size={24} /><Text style={styles.chatText}>Message</Text></TouchableOpacity>
           </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Call Button */}
      <View style={styles.floatingCallContainer}>
         <TouchableOpacity style={styles.callMainBtn} onPress={handleCall}>
            <LinearGradient colors={[COLORS.primary, '#4C1D95']} style={styles.callGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
               <Phone color="#FFF" size={24} fill="#FFF" />
               <Text style={styles.callBtnText}>Start Video Call</Text>
            </LinearGradient>
         </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  coverContainer: { height: width * 1.2, width: '100%', position: 'relative' },
  coverImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  coverBadge: { position: 'absolute', bottom: 30, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  content: { padding: 20, marginTop: -20 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  nameText: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  idText: { color: COLORS.textGray, fontSize: 12, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  followBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.primary },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  followText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  statsBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, paddingVertical: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLabel: { color: COLORS.textGray, fontSize: 10, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  bioText: { color: COLORS.textGray, fontSize: 14, lineHeight: 22, fontWeight: '500' },
  infoGrid: { marginTop: 15, gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { color: COLORS.textGray, fontSize: 13, fontWeight: '600' },
  galleryItem: { width: 120, height: 160, borderRadius: 20, marginRight: 15, overflow: 'hidden' },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  circleBtn: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatBtn: { flex: 1, height: 56, borderRadius: 20, backgroundColor: 'rgba(108, 43, 217, 0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.primary },
  chatText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  floatingCallContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  callMainBtn: { width: '100%', height: 64, borderRadius: 24, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  callGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  callBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});

export default HostProfileScreen;
