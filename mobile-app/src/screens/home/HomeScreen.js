import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { Search, Bell, ShieldCheck, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [appSettings, setAppSettings] = useState({ callRate: 30 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) setCurrentUser(JSON.parse(userDataStr));

      const [bannerRes, hostRes, settingsRes] = await Promise.all([
        api.get('/settings/app').catch(() => ({ data: { banners: [] } })), // Fetching from unified settings/app
        api.get('/hosts').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: { callRate: 30 } }))
      ]);
      
      // Handle banners if they are in settingsRes or dedicated res
      if (bannerRes.data && bannerRes.data.banners) {
        setBanners(bannerRes.data.banners);
      } else {
        // Fallback to dedicated marketing banners if exists
        const marketingRes = await api.get('/marketing/banners').catch(() => ({ data: [] }));
        setBanners(marketingRes.data);
      }

      setHosts(hostRes.data);
      if (settingsRes.data) setAppSettings(settingsRes.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const renderBanner = ({ item }) => (
    <View style={styles.bannerContainer}>
      <Image 
        source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${BASE_URL}/${item.imageUrl}` }} 
        style={styles.bannerImage} 
        resizeMode="cover"
      />
    </View>
  );

  const renderHost = ({ item }) => (
    <TouchableOpacity 
      style={styles.hostCard}
      activeOpacity={0.9}
      onPress={() => {
        if (!currentUser) return;
        navigation.navigate('VideoCall', {
          userId: currentUser.id || currentUser._id,
          userName: currentUser.name || 'User',
          hostId: item._id,
          hostName: item.name,
          callId: 'call_' + Date.now(),
          callRatePerMinute: appSettings.callRate || 30
        });
      }}
    >
      <View style={styles.hostImageContainer}>
        <Avatar.Image size={120} source={{ uri: item.profilePicture || 'https://via.placeholder.com/120' }} />
        <View style={[styles.statusDot, { backgroundColor: item.status === 'Online' ? COLORS.success : COLORS.error }]} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.hostOverlay}>
           <View style={styles.ratingBadge}>
              <Star size={10} fill="#FFD700" color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating || '4.8'}</Text>
           </View>
        </LinearGradient>
      </View>
      <View style={styles.hostInfo}>
        <Text style={styles.hostName}>{item.name}</Text>
        <Text style={styles.hostPrice}>{appSettings.callRate || 30} coins/min</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {currentUser?.name?.split(' ')[0] || 'Member'}</Text>
          <Text style={styles.headerTitle}>ZORA PREMIUM</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}><Search color={COLORS.textWhite} size={22} /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Bell color={COLORS.textWhite} size={22} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Completion */}
        {currentUser && (!currentUser.gender || !currentUser.verificationSelfie) && (
          <TouchableOpacity 
            style={styles.alertBanner} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <ShieldCheck color="#FFF" size={20} />
            <Text style={styles.alertText}>Verify your profile to unlock full features</Text>
          </TouchableOpacity>
        )}

        {/* Banners */}
        <FlatList
          data={banners.filter(b => b.status === 'Active')}
          renderItem={renderBanner}
          keyExtractor={item => item._id || item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerList}
        />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Hosts</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        {/* Hosts Grid */}
        <FlatList
          data={hosts}
          renderItem={renderHost}
          keyExtractor={item => item._id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.hostList}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  greeting: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  headerTitle: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  alertBanner: {
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerList: {
    marginTop: 10,
  },
  bannerContainer: {
    width: width - (SPACING.lg * 2),
    height: 160,
    marginHorizontal: SPACING.lg,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.2)',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: '800',
  },
  viewAll: {
    color: COLORS.accentGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  hostList: {
    paddingHorizontal: SPACING.sm,
  },
  hostCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    margin: 8,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  hostImageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  hostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    padding: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hostInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  hostName: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  hostPrice: {
    color: COLORS.accentGlow,
    fontSize: 12,
    marginTop: 2,
  }
});

export default HomeScreen;
