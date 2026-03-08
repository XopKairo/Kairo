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
  ActivityIndicator
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
  MoreHorizontal
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import api from '../../services/api';
import socketService from '../../services/socketService';

const { width } = Dimensions.get('window');

const HostProfileScreen = ({ route, navigation }) => {
  const { hostId } = route.params;
  const [host, setHost] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);

  const fetchHostProfile = async () => {
    try {
      const response = await api.get(`/users/${hostId}`);
      setHost(response.data);
      
      const followRes = await api.get(`/interactions/follow/status/${hostId}`);
      setIsFollowing(followRes.data.isFollowing);

      const giftsRes = await api.get('/interactions/gifts');
      setGifts(giftsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostProfile();
  }, [hostId]);

  const handleSendGift = async (gift) => {
    setSendingGift(true);
    try {
      const response = await api.post('/interactions/gifts/send', {
        giftId: gift._id,
        receiverId: hostId,
        callId: null // Independent gifting
      });
      if (response.data.success) {
        Alert.alert('Gift Sent!', `Successfully sent ${gift.name} to ${host.name}`);
        setGiftModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Gifting Failed', error.message || 'Insufficient coins or server error');
    } finally {
      setSendingGift(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await api.post(`/users/follow/${hostId}`);
      if (res.data.success) {
        setIsFollowing(res.data.following);
      }
    } catch (error) {
      Alert.alert('Error', 'Action failed. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCall = () => {
    navigation.navigate('VideoCall', { 
      hostId: host._id, 
      hostName: host.name,
      callId: `call_${Date.now()}` 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image Section */}
        <View style={styles.imageHeader}>
          <Image 
            source={host?.profilePicture ? { uri: host.profilePicture } : require('../../../assets/icon.png')} 
            style={styles.mainImage}
          />
          <View style={styles.overlay}>
             <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <ChevronLeft color="#FFF" size={28} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.menuBtn}>
                <MoreHorizontal color="#FFF" size={24} />
             </TouchableOpacity>
          </View>
          
          <View style={styles.statusBadge}>
             <View style={[styles.statusDot, { backgroundColor: host?.isOnline ? COLORS.success : '#999' }]} />
             <Text style={styles.statusText}>{host?.isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.hostName}>{host?.name || 'Unknown'}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationText}>{host?.location || 'Global Elite'}</Text>
                <View style={styles.dot} />
                <Text style={styles.ageText}>{host?.age || 21} Years</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Star color="#FFD700" size={16} fill="#FFD700" />
              <Text style={styles.ratingValue}>{host?.avgRating || '4.9'}</Text>
            </View>
          </View>

          {/* Stats Summary */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{host?.followers?.length || 120}+</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{host?.callCount || 450}</Text>
              <Text style={styles.statLabel}>Calls</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>15k</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>About Me</Text>
             <Text style={styles.bioText}>{host?.bio || "I am a high-energy elite companion. Looking forward to engaging conversations and meaningful interactions."}</Text>
          </View>

          {/* Interests Tags */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Interests</Text>
             <View style={styles.tagRow}>
                {(host?.interests || ['Travel', 'Music', 'Fitness', 'Art']).map((tag, i) => (
                   <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                   </View>
                ))}
             </View>
          </View>

          {/* Gallery Section */}
          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Moments</Text>
             </View>
             {host?.gallery && host.gallery.length > 0 ? (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                  {host.gallery.map((img, i) => (
                     <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
                  ))}
               </ScrollView>
             ) : (
               <View style={styles.emptyGallery}>
                  <Text style={styles.emptyText}>No moments shared yet.</Text>
               </View>
             )}
          </View>
          
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
         <TouchableOpacity 
            style={[styles.followBtn, isFollowing && styles.followedBtn]} 
            onPress={handleFollow}
            disabled={followLoading}
         >
            {isFollowing ? <UserCheck color="#FFF" size={24} /> : <UserPlus color={COLORS.primary} size={24} />}
         </TouchableOpacity>

         <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { userId: hostId, name: host.name })}>
            <MessageCircle color="#FFF" size={24} />
         </TouchableOpacity>

         <TouchableOpacity style={styles.giftBtn} onPress={() => setGiftModalVisible(true)}>
            <Gift color="#FFD700" size={24} />
         </TouchableOpacity>

         <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Video color="#FFF" size={24} fill="#FFF" />
            <Text style={styles.callBtnText}>Call</Text>
         </TouchableOpacity>
      </View>

      {/* Real Gifting Modal */}
      <Modal visible={giftModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send a Gift</Text>
              <TouchableOpacity onPress={() => setGiftModalVisible(false)}>
                <Text style={{ color: COLORS.textGray }}>Close</Text>
              </TouchableOpacity>
            </View>
            
            {gifts.length === 0 ? (
              <Text style={styles.emptyText}>No gifts available.</Text>
            ) : (
              <FlatList 
                data={gifts}
                numColumns={3}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.giftCard} onPress={() => handleSendGift(item)}>
                    <Text style={{ fontSize: 32 }}>{item.icon || '🎁'}</Text>
                    <Text style={styles.giftName}>{item.name}</Text>
                    <Text style={styles.giftPrice}>{item.coinCost} Coins</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            {sendingGift && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  imageHeader: { height: width * 1.2, width: width, position: 'relative' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  statusBadge: { position: 'absolute', bottom: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  content: { flex: 1, backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: SPACING.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  hostName: { color: COLORS.textWhite, fontSize: 28, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { color: COLORS.textGray, fontSize: 14 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textGray, marginHorizontal: 8 },
  ageText: { color: COLORS.textGray, fontSize: 14 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  ratingValue: { color: '#FFD700', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.cardBackground, borderRadius: 24, padding: 20, marginBottom: 30, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: COLORS.textWhite, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.textGray, fontSize: 10, marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.05)' },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: '800', marginBottom: 15 },
  seeAll: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  bioText: { color: COLORS.textGray, fontSize: 15, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: 'rgba(159, 103, 255, 0.08)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.15)' },
  tagText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  galleryScroll: { marginLeft: -5 },
  galleryImage: { width: 120, height: 160, borderRadius: 18, marginRight: 15, resizeMode: 'cover' },
  emptyGallery: { padding: 30, alignItems: 'center', backgroundColor: COLORS.cardBackground, borderRadius: 20 },
  emptyText: { color: COLORS.textGray, fontSize: 14 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 80, backgroundColor: 'rgba(18, 18, 24, 0.95)', borderRadius: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.2)', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  followBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  followedBtn: { backgroundColor: COLORS.primary },
  chatBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  giftBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  callBtn: { flex: 1, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  callBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: COLORS.textWhite, fontSize: 20, fontWeight: 'bold' },
  giftCard: { flex: 1, alignItems: 'center', padding: 10, margin: 5, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15 },
  giftName: { color: COLORS.textWhite, fontSize: 12, marginTop: 5 },
  giftPrice: { color: COLORS.accentGlow, fontSize: 10, fontWeight: 'bold' }
});

export default HostProfileScreen;
