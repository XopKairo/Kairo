import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Modal, StatusBar } from 'react-native';
import { Avatar, Card, IconButton } from 'react-native-paper';
import { ShieldCheck, MapPin, Globe2, MessageCircle, Phone, Heart, Share2, MoreVertical, ChevronLeft, ShieldAlert, Star, Play, Ban } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import MomentGallery from '../../components/MomentGallery';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const HostProfileScreen = ({ route, navigation }) => {
  const { hostId: routeHostId, hostData: initialData } = route.params || {};
  const { user: currentUser, showAlert } = useAuth();
  const [host, setHost] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canLike, setCanLike] = useState(false);
  const [showPostCallModal, setShowPostCallModal] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [moments, setMoments] = useState([]);

  useEffect(() => {
    fetchHostDetails();
    fetchMoments();
    if (route.params?.justFinishedCall) {
      setShowPostCallModal(true);
    }
  }, [routeHostId, route.params?.justFinishedCall]);

  const fetchMoments = async () => {
    try {
      const res = await api.get(`user/moments/host/${routeHostId}`);
      setMoments(res.data || []);
    } catch (e) {}
  };

  const fetchHostDetails = async () => {
    const targetId = routeHostId || initialData?._id;
    if (!targetId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setFetchError(false);
    
    try {
      const res = await api.get(`public/hosts/${targetId}`);
      if (res.data && res.data._id) {
        setHost(res.data);
        if (currentUser) {
           // Parallel status checks
           const [followRes, likeRes] = await Promise.all([
             api.get(`user/interactions/follow/status/${res.data.userId?._id || res.data.userId}`),
             api.get(`user/interactions/like/status/${res.data._id}`)
           ]);
           setIsFollowing(followRes.data.isFollowing);
           setCanLike(route.params?.justFinishedCall ? true : likeRes.data.canLike);
        }
      } else {
        setFetchError(true);
        setErrorMessage('Host not found on server.');
      }
    } catch (error) {
      console.error('Fetch Host Error:', error);
      setFetchError(true);
      
      // Better 404 Handling
      if (error.response && error.response.status === 404) {
        setErrorMessage("Host profile not found (404). It might have been deleted.");
      } else {
        setErrorMessage(error.message || 'Failed to connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return navigation.navigate('Login');
    if (!canLike) return showAlert('Call Required', 'You can only like after calling this host!', 'notice');
    
    try {
      await api.post('user/interactions/like', { hostId: host._id });
      setCanLike(false);
      setHost(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      showAlert('Liked!', 'Your like has been registered.', 'success');
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to like');
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return navigation.navigate('Login');
    try {
      const targetUserId = host.userId?._id || host.userId;
      if (isFollowing) {
        await api.delete(`user/interactions/follow/${targetUserId}`);
        setIsFollowing(false);
        setHost(prev => ({ 
          ...prev, 
          followers: (prev.followers || []).filter(id => id !== (currentUser._id || currentUser.id)) 
        }));
      } else {
        await api.post(`user/interactions/follow`, { followeeId: targetUserId });
        setIsFollowing(true);
        setHost(prev => ({ 
          ...prev, 
          followers: [...(prev.followers || []), (currentUser._id || currentUser.id)] 
        }));
      }
    } catch (e) {
      console.error('Follow Error:', e);
    }
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
              await api.post(`user/users/block/${targetId}`);
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
  if (!host && fetchError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Host Not Found</Text>
        <Text style={{ color: COLORS.textGray, textAlign: 'center', marginTop: 10 }}>{errorMessage}</Text>
        <TouchableOpacity 
          onPress={() => fetchHostDetails()} 
          style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.primary, borderRadius: 12, width: '60%', alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, width: '60%', alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!host) return null;

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
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.nameText}>{host.name}</Text>
                    {host.isVerified && <ShieldCheck color="#10B981" size={20} fill="#10B981" />}
                    {host.badge && (
                      <LinearGradient 
                        colors={[host.badge.color || COLORS.primary, '#FFF']} 
                        start={{x:0, y:0}} end={{x:1, y:1}}
                        style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 4 }}
                      >
                        <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>{host.badge.name.toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                 </View>
                 <Text style={styles.idText}>ID: #{host.hostId || 'PENDING'}</Text>
              </View>
              <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]} onPress={handleFollow}>
                 <Text style={styles.followText}>{isFollowing ? 'Fan ✅' : '+ Fan'}</Text>
              </TouchableOpacity>
           </View>

           <View style={styles.statsBar}>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.followers?.length || 0}</Text><Text style={styles.statLabel}>Fans</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.totalCalls || 0}</Text><Text style={styles.statLabel}>Calls</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.avgRating?.toFixed(1) || '0.0'}</Text><Text style={styles.statLabel}>Rating</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{host.callRatePerMinute || 30}</Text><Text style={styles.statLabel}>Coins/m</Text></View>
           </View>

           <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Moments</Text>
              <MomentGallery moments={moments} onMomentPress={(moment) => navigation.navigate('Chat', { recipient: host })} />
           </View>

           <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <Text style={styles.bioText}>{host.about || host.bio || `Hi, I am ${host.name}. Let's connect and have a good time!`}</Text>
              
              <View style={styles.infoGrid}>
                 <View style={styles.infoItem}><MapPin color={COLORS.textGray} size={14} /><Text style={styles.infoValue}>{host.location || 'India'}</Text></View>
                 <View style={styles.infoItem}><Globe2 color={COLORS.textGray} size={14} /><Text style={styles.infoValue}>{Array.isArray(host.languages) ? host.languages.join(', ') : host.languages || 'English'}</Text></View>
              </View>
           </View>

           {host.interests && host.interests.length > 0 && (
             <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                   {host.interests.map((interest, index) => (
                      <View key={index} style={styles.interestBadge}>
                         <Text style={styles.interestText}>#{typeof interest === 'object' ? interest.name : interest}</Text>
                      </View>
                   ))}
                </View>
             </View>
           )}

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
              <TouchableOpacity style={[styles.circleBtn, canLike && { backgroundColor: 'rgba(255, 75, 75, 0.15)', borderColor: '#FF4B4B' }]} onPress={handleLike}>
                 <Heart color={canLike ? "#FF4B4B" : "#FFF"} size={22} fill={canLike ? "#FF4B4B" : "transparent"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleBtn} onPress={() => showAlert('Shared', 'Profile link copied to clipboard!', 'success')}><Share2 color="#FFF" size={22} /></TouchableOpacity>
              <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { recipient: host })}><MessageCircle color="#FFF" size={24} /><Text style={styles.chatText}>Message</Text></TouchableOpacity>
           </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Post Call Pro-Look Popup */}
      <Modal visible={showPostCallModal} transparent animationType="fade">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <TouchableOpacity style={styles.modalClose} onPress={() => setShowPostCallModal(false)}><ChevronLeft color="#FFF" size={24} /></TouchableOpacity>
               
               <Image source={{ uri: host.profilePicture }} style={styles.modalImg} />
               <LinearGradient colors={['transparent', 'rgba(15,10,25,1)']} style={styles.modalGradient} />

               <View style={styles.modalTextContainer}>
                  <Text style={styles.modalTitle}>Call Completed!</Text>
                  <Text style={styles.modalSubtitle}>How was your experience with {host.name}?</Text>
                  
                  <View style={styles.modalStats}>
                     <View style={styles.mStatItem}><Text style={styles.mStatValue}>{host.likes || 0}</Text><Text style={styles.mStatLabel}>Likes</Text></View>
                     <View style={styles.mStatItem}><Text style={styles.mStatValue}>{host.totalCalls || 0}</Text><Text style={styles.mStatLabel}>Calls</Text></View>
                  </View>

                  <TouchableOpacity style={styles.modalLikeBtn} onPress={async () => { await handleLike(); setShowPostCallModal(false); }}>
                     <Heart color="#FFF" size={24} fill="#FFF" />
                     <Text style={styles.modalLikeText}>Send a Like</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPostCallModal(false)}>
                     <Text style={styles.modalCloseText}>Maybe Later</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

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
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)' },
  interestText: { color: COLORS.accentGlow, fontSize: 12, fontWeight: 'bold' },
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
  callBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: '#1F1B2E', borderRadius: 32, overflow: 'hidden', elevation: 20 },
  modalClose: { position: 'absolute', top: 20, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalImg: { width: '100%', height: 350, resizeMode: 'cover' },
  modalGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  modalTextContainer: { padding: 30, marginTop: -100, alignItems: 'center' },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  modalSubtitle: { color: COLORS.textGray, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  modalStats: { flexDirection: 'row', gap: 30, marginBottom: 30 },
  mStatItem: { alignItems: 'center' },
  mStatValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  mStatLabel: { color: COLORS.textGray, fontSize: 10, fontWeight: 'bold' },
  modalLikeBtn: { width: '100%', height: 60, borderRadius: 20, backgroundColor: '#FF4B4B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#FF4B4B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  modalLikeText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 20 },
  modalCloseText: { color: COLORS.textGray, fontSize: 14, fontWeight: 'bold' }
});

export default HostProfileScreen;
