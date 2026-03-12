import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { 
  Video, 
  Heart, 
  MessageCircle, 
  Star, 
  Gift, 
  UserPlus, 
  UserCheck, 
  ChevronLeft,
  MoreHorizontal,
  MapPin,
  Globe2,
  ShieldCheck,
  Play,
  UserX,
  Share2,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const HostProfileScreen = ({ route, navigation }) => {
  const { hostId } = route.params;
  const [host, setHost] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isBeautyEnabled, setIsBeautyMode] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [hostRes, followRes, reviewRes, userRes] = await Promise.all([
          api.get(`/users/${hostId}`),
          api.get(`/interactions/follow/status/${hostId}`),
          api.get(`/reviews/${hostId}`).catch(() => ({ data: [] })),
          api.get('/auth/me').catch(() => ({ data: {} }))
        ]);
        setHost(hostRes.data);
        setIsFollowing(followRes.data.isFollowing);
        setReviews(reviewRes.data || []);
        setIsVip(userRes.data.isVip || false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [hostId]);

  const handleCall = () => {
    if (host?.isVipOnly && !isVip) {
      Alert.alert('VIP Feature', 'This host accepts calls from VIP members only. Join VIP Club to connect!', [
        { text: 'Join VIP', onPress: () => navigation.navigate('VIP') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }
    
    navigation.navigate('VideoCall', { 
      hostId: host._id, 
      hostName: host.name,
      callId: `call_${Date.now()}`,
      callRatePerMinute: host.callRatePerMinute || 30,
      beautyMode: isBeautyEnabled
    });
  };

  const handleBlock = async () => {
    Alert.alert('Block User', 'Are you sure you want to block this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => {
          await api.post(`/users/block/${hostId}`);
          navigation.goBack();
      }}
    ]);
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const languagesStr = host?.languages?.join(', ') || 'English';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        {/* Cover Section */}
        <View style={styles.coverSection}>
           <Image source={{ uri: host?.profilePicture || 'https://ui-avatars.com/api/?name=Host&background=random&size=400' }} style={styles.coverImg} />
           <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.coverGradient}>
              <View style={styles.topBar}>
                 <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color="#FFF" size={24} />
                 </TouchableOpacity>
                 <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={styles.circleBtn} onPress={() => Alert.alert('Shared', 'Profile link copied!')}>
                       <Share2 color="#FFF" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.circleBtn} onPress={handleBlock}>
                       <UserX color="#FFF" size={20} />
                    </TouchableOpacity>
                 </View>
              </View>

              <View style={styles.coverInfo}>
                 <View style={styles.nameRow}>
                    <Text style={styles.hostNameLarge}>{host?.name}, {host?.age || 21}</Text>
                    {host?.isVerified && <ShieldCheck color="#10B981" fill="#10B981" size={24} />}
                 </View>
                 <Text style={styles.hostIdText}>ID: {host?.hostId || '882211'}</Text>
                 
                 <View style={styles.statusRow}>
                    <View style={[styles.statusPoint, { backgroundColor: host?.status === 'Online' ? COLORS.success : '#999' }]} />
                    <Text style={styles.statusLabel}>{host?.status?.toUpperCase() || 'OFFLINE'}</Text>
                 </View>
              </View>
           </LinearGradient>
        </View>

        {/* Moments / Gallery */}
        <View style={styles.section}>
           <Text style={styles.sectionLabel}>Moments</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
              {host?.shortVideoUrl && (
                <TouchableOpacity style={styles.videoPreview}>
                   <Image source={{ uri: host.profilePicture }} style={styles.galleryImg} />
                   <View style={styles.playOverlay}><Play color="#FFF" fill="#FFF" size={24} /></View>
                </TouchableOpacity>
              )}
              {host?.photos?.map((img, i) => (
                 <Image key={i} source={{ uri: img }} style={styles.galleryImg} />
              ))}
           </ScrollView>
        </View>

        {/* Identity Section */}
        <View style={styles.identitySection}>
           <View style={styles.idCard}>
              <MapPin color={COLORS.primary} size={18} />
              <Text style={styles.idText}>{host?.location || 'Unknown'}</Text>
           </View>
           <View style={styles.idCard}>
              <Globe2 color={COLORS.primary} size={18} />
              <Text style={styles.idText}>{languagesStr}</Text>
           </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.statsCard}>
           <View style={styles.statItem}>
              <Text style={styles.statVal}>{host?.followers?.length || '1.2k'}</Text>
              <Text style={styles.statLab}>Followers</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
              <Text style={styles.statVal}>{host?.callCount || '450'}</Text>
              <Text style={styles.statLab}>Calls</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                 <Star color="#FFD700" fill="#FFD700" size={16} />
                 <Text style={styles.statVal}>{host?.avgRating || '4.8'}</Text>
              </View>
              <Text style={styles.statLab}>{host?.totalReviews || 0} Reviews</Text>
           </View>
        </View>

        {/* Bio & Interests */}
        <View style={styles.section}>
           <Text style={styles.sectionLabel}>About Me</Text>
           <Text style={styles.bioText}>{host?.bio || 'I love to make new friends and have meaningful conversations.'}</Text>
           
           <View style={styles.tagRow}>
              {(host?.interests || ['Travel', 'Music', 'Fitness']).map((tag, i) => (
                 <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
              ))}
           </View>
        </View>

        {/* Received Gifts */}
        <View style={styles.section}>
           <Text style={styles.sectionLabel}>Gifts Wall</Text>
           <View style={styles.giftGrid}>
              {host?.receivedGifts?.length > 0 ? host.receivedGifts.map((g, i) => (
                 <View key={i} style={styles.giftItem}>
                    <Text style={{ fontSize: 24 }}>🎁</Text>
                    <Text style={styles.giftCount}>x{g.count}</Text>
                 </View>
              )) : (
                 <Text style={styles.emptyText}>No gifts received yet.</Text>
              )}
           </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
           <Text style={styles.sectionLabel}>User Reviews</Text>
           {reviews.length > 0 ? reviews.map((r, i) => (
              <View key={i} style={styles.reviewItem}>
                 <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{r.userId?.name || 'User'}</Text>
                    <View style={styles.ratingRow}>
                       {[1,2,3,4,5].map(s => <Star key={s} size={10} color={s <= r.stars ? "#FFD700" : "#333"} fill={s <= r.stars ? "#FFD700" : "transparent"} />)}
                    </View>
                 </View>
                 <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
           )) : (
              <Text style={styles.emptyText}>No reviews yet.</Text>
           )}
        </View>

      </ScrollView>

      {/* Footer Bar */}
      <LinearGradient colors={['transparent', 'rgba(15,10,25,0.95)', '#0F0A19']} style={styles.footer}>
         <View style={styles.footerInner}>
            <TouchableOpacity style={styles.footerBtn} onPress={() => setIsFollowing(!isFollowing)}>
               {isFollowing ? <UserCheck color={COLORS.primary} size={24} /> : <UserPlus color="#FFF" size={24} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('Chat', { userId: hostId, name: host.name })}>
               <MessageCircle color="#FFF" size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: 'rgba(255,215,0,0.1)' }]} onPress={() => setGiftModalVisible(true)}>
               <Gift color="#FFD700" size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainCallBtn} onPress={handleCall}>
               <View style={styles.callIconBox}><Video color="#FFF" fill="#FFF" size={24} /></View>
               <View>
                  <Text style={styles.callLabel}>VIDEO CALL</Text>
                  <Text style={styles.callPrice}>{host?.callRatePerMinute || 30} coins/min</Text>
               </View>
            </TouchableOpacity>
         </View>
         
         {/* Beauty Mode Toggle */}
         <View style={styles.beautyBar}>
            <Sparkles color={isBeautyEnabled ? COLORS.primary : COLORS.textGray} size={16} />
            <Text style={[styles.beautyText, isBeautyEnabled && { color: COLORS.primary }]}>Beauty Mode</Text>
            <TouchableOpacity 
               style={[styles.toggleBase, isBeautyEnabled && { backgroundColor: COLORS.primary }]} 
               onPress={() => setIsBeautyMode(!isBeautyEnabled)}
            >
               <View style={[styles.toggleThumb, isBeautyEnabled && { transform: [{ translateX: 14 }] }]} />
            </TouchableOpacity>
         </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  coverSection: { height: width * 1.25, width: width },
  coverImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  coverInfo: { padding: 20, paddingBottom: 30 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hostNameLarge: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  hostIdText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPoint: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  section: { paddingHorizontal: 20, marginTop: 30 },
  sectionLabel: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 15 },
  galleryScroll: { marginLeft: -5 },
  galleryImg: { width: 100, height: 130, borderRadius: 15, marginRight: 12 },
  videoPreview: { position: 'relative' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  
  identitySection: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 },
  idCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 15, gap: 10 },
  idText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  
  statsCard: { flexDirection: 'row', marginHorizontal: 20, marginTop: 25, backgroundColor: COLORS.cardBackground, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  statLab: { color: COLORS.textGray, fontSize: 10, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  
  bioText: { color: COLORS.textGray, fontSize: 14, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  tag: { backgroundColor: 'rgba(108, 43, 217, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(108, 43, 217, 0.2)' },
  tagText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  giftItem: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 12, alignItems: 'center' },
  giftCount: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  
  reviewItem: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderRadius: 15, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewerName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  reviewComment: { color: COLORS.textGray, fontSize: 12 },
  emptyText: { color: COLORS.textGray, fontSize: 12, fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 30, paddingTop: 40 },
  footerInner: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, alignItems: 'center' },
  footerBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  mainCallBtn: { flex: 1, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 15 },
  callIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  callLabel: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  callPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold' },
  
  beautyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 15 },
  beautyText: { color: COLORS.textGray, fontSize: 12, fontWeight: 'bold' },
  toggleBase: { width: 34, height: 20, borderRadius: 10, backgroundColor: '#333', padding: 3 },
  toggleThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFF' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }
});

export default HostProfileScreen;
