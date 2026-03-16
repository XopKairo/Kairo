import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { ShieldCheck, Wallet, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api, { BASE_URL } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import HostCard from '../../components/HostCard';
import Swiper from 'react-native-deck-swiper';
import SwipeCard from '../../components/SwipeCard';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [appSettings, setAppSettings] = useState({ callRate: 30 });
  const [activeTab, setActiveTab] = useState('New');

  const tabs = ['New', 'For You', 'Nearby', 'Follow'];

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      let user = null;
      if (userDataStr) {
        user = JSON.parse(userDataStr);
        setCurrentUser(user);
      }

      // Temporarily show all hosts regardless of gender for testing
      let targetGender = '';
      // if (user && user.gender) {
      //    if (user.gender === 'Male') targetGender = 'Female';
      //    else if (user.gender === 'Female') targetGender = 'Male';
      // }

      const [bannerRes, hostRes, settingsRes] = await Promise.all([
        api.get('public/banners/active').catch(() => ({ data: [] })), 
        api.get('public/hosts', { params: { targetGender, tabFilter: activeTab, userId: user?.id || user?._id } }).catch(() => ({ data: [] })),
        api.get('public/settings/app').catch(() => ({ data: { callRate: 30 } }))
      ]);
      
      setBanners(bannerRes.data || []);
      setHosts(hostRes.data || []);
      if (settingsRes.data) setAppSettings(settingsRes.data);

      // Supreme Sync: Socket real-time status update
      socketService.setStatusUpdateHandler((data) => {
        setHosts((prevHosts) => 
          prevHosts.map((h) => 
            h._id === data.hostId ? { ...h, status: data.status } : h
          )
        );
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (hostId, action) => {
    try {
      await api.post('public/hosts/interaction', { hostId, action });
    } catch (e) {}
  };

  const handleCall = (host) => {
    if (!currentUser) return;
    handleInteraction(host._id, 'like');
    navigation.navigate('VideoCall', {
      userId: currentUser.id || currentUser._id,
      userName: currentUser.name || 'User',
      hostId: host._id,
      hostName: host.name,
      callId: 'call_' + Date.now(),
      isIncoming: false,
      callRatePerMinute: appSettings.callRate || 30
    });
  };

  const handleChat = (host) => {
    navigation.navigate('Chat', { recipient: host });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../../assets/icon.png')} style={styles.logoImage} />
          <View>
             <Text style={styles.brandName}>ZORA</Text>
             <Text style={styles.homeIndicator}>HOME</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Games')}>
            <Trophy color={COLORS.primary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Wallet')}>
            <Wallet color={COLORS.primary} size={18} />
            <Text style={styles.walletText}>{currentUser?.coins || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        
        {activeTab !== 'For You' && banners.length > 0 && (
          <FlatList
            data={banners}
            renderItem={({ item }) => (
              <View style={styles.bannerContainer}>
                <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${BASE_URL}/${item.imageUrl}` }} style={styles.bannerImage} resizeMode="cover" />
              </View>
            )}
            keyExtractor={item => item._id || item.id}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={styles.bannerList}
          />
        )}

        <View style={styles.tabsContainer}>
           {tabs.map((tab) => (
             <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
               <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {activeTab === 'For You' && hosts.length > 0 ? (
          <View style={styles.swiperContainer}>
            <Swiper
              key={`swiper-${hosts.length}-${activeTab}`}
              cards={hosts}
              renderCard={(card) => <SwipeCard item={card} onCall={() => handleCall(card)} onChat={() => handleChat(card)} />}
              onSwipedLeft={(idx) => handleInteraction(hosts[idx]._id, 'pass')}
              onSwipedRight={(idx) => handleInteraction(hosts[idx]._id, 'like')}
              cardIndex={0}
              keyExtractor={(card) => card._id || card.id || Math.random().toString()}
              backgroundColor={'transparent'}
              stackSize={Math.min(hosts.length, 3)}
              infinite
              verticalSwipe={false}
            />
          </View>
        ) : (
          <View style={{ minHeight: 400, marginTop: 10 }}>
            {loading ? (
               <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
            ) : hosts.length > 0 ? (
              <FlashList data={hosts} renderItem={({ item }) => <HostCard item={item} currentUser={currentUser} navigation={navigation} />} keyExtractor={item => item._id} numColumns={2} estimatedItemSize={200} scrollEnabled={false} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found in your area.</Text>
                <TouchableOpacity onPress={() => fetchData()} style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.primary, borderRadius: 8 }}>
                   <Text style={{ color: '#FFF' }}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, borderRadius: 8, marginRight: 10 },
  brandName: { color: COLORS.textWhite, fontSize: 18, fontWeight: '900', letterSpacing: 2, lineHeight: 20 },
  homeIndicator: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  walletBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(108, 43, 217, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(108, 43, 217, 0.4)', gap: 6 },
  walletText: { color: COLORS.textWhite, fontWeight: 'bold', fontSize: 14 },
  bannerList: { marginTop: 15, marginBottom: 5 },
  bannerContainer: { width: width - (SPACING.lg * 2), height: 140, marginHorizontal: SPACING.lg, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.2)' },
  bannerImage: { width: '100%', height: '100%' },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginHorizontal: SPACING.lg, marginTop: 15, marginBottom: 5, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 16 },
  tabBtnActive: { backgroundColor: COLORS.cardBackground, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  tabText: { color: COLORS.textGray, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  swiperContainer: { flex: 1, height: height * 0.75, marginTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textGray, fontSize: 15 }
});

export default HomeScreen;
