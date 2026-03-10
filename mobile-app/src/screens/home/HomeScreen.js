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

const { width, height } = Dimensions.get('window');

import Swiper from 'react-native-deck-swiper';
import LottieView from 'lottie-react-native';
import SwipeCard from '../../components/SwipeCard';

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [appSettings, setAppSettings] = useState({ callRate: 30 });
  const [activeTab, setActiveTab] = useState('For You');
  const [isSearching, setIsSearching] = useState(false);

  const tabs = ['Follow', 'Nearby', 'New', 'For You'];

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'Nearby') {
        setIsSearching(true);
        setTimeout(() => {
          fetchData();
          setIsSearching(false);
        }, 3000);
      } else {
        fetchData();
      }
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

      let targetGender = '';
      if (user && user.gender) {
         if (user.gender === 'Male') targetGender = 'Female';
         else if (user.gender === 'Female') targetGender = 'Male';
      }

      const [bannerRes, hostRes, settingsRes] = await Promise.all([
        api.get('/admin/banners').catch(() => ({ data: [] })), 
        api.get('/hosts', { params: { targetGender, tabFilter: activeTab, userId: user?.id || user?._id } }).catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: { callRate: 30 } }))
      ]);
      
      setBanners(bannerRes.data || []);
      setHosts(hostRes.data || []);
      if (settingsRes.data) setAppSettings(settingsRes.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (host) => {
    if (!currentUser) return;
    navigation.navigate('VideoCall', {
      userId: currentUser.id || currentUser._id,
      userName: currentUser.name || 'User',
      hostId: host._id,
      hostName: host.name,
      callId: 'call_' + Date.now(),
      callRatePerMinute: appSettings.callRate || 30
    });
  };

  const handleChat = (host) => {
    navigation.navigate('Chat', { userId: host._id, name: host.name });
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

      {/* Nearby Searching Animation */}
      {activeTab === 'Nearby' && isSearching ? (
        <View style={styles.searchingContainer}>
          <LottieView 
            source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_m9ubts9m.json' }} 
            autoPlay 
            loop 
            style={styles.lottie} 
          />
          <Text style={styles.searchingText}>Finding users near you...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
          
          {/* Banners (Hidden in Swipe mode to save space) */}
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

          {/* Top Tabs */}
          <View style={styles.tabsContainer}>
             {tabs.map((tab) => (
               <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                 <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
               </TouchableOpacity>
             ))}
          </View>

          {/* Swipe UI for "For You" */}
          {activeTab === 'For You' && hosts.length > 0 ? (
            <View style={styles.swiperContainer}>
              <Swiper
                cards={hosts}
                renderCard={(card) => <SwipeCard item={card} onCall={() => handleCall(card)} onChat={() => handleChat(card)} />}
                onSwipedLeft={(idx) => console.log('Passed', hosts[idx].name)}
                onSwipedRight={(idx) => console.log('Liked', hosts[idx].name)}
                onSwipedTop={(idx) => handleCall(hosts[idx])}
                onSwipedBottom={(idx) => console.log('Down', hosts[idx].name)}
                cardIndex={0}
                backgroundColor={'transparent'}
                stackSize={3}
                infinite
                verticalSwipe={true}
                overlayLabels={{
                  left: { title: 'PASS', style: { label: { color: 'red', borderColor: 'red', borderWidth: 2, fontSize: 32 }, wrapper: { alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 } } },
                  right: { title: 'LIKE', style: { label: { color: 'green', borderColor: 'green', borderWidth: 2, fontSize: 32 }, wrapper: { alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 } } },
                  top: { title: 'CALLING...', style: { label: { color: COLORS.primary, borderColor: COLORS.primary, borderWidth: 2, fontSize: 32 }, wrapper: { alignItems: 'center', justifyContent: 'center' } } }
                }}
              />
            </View>
          ) : (
            /* Standard Grid for other tabs */
            <View style={{ minHeight: 400, marginTop: 10 }}>
              {loading ? (
                 <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
              ) : hosts.length > 0 ? (
                <FlashList data={hosts} renderItem={({ item }) => <HostCard item={item} currentUser={currentUser} navigation={navigation} />} keyExtractor={item => item._id} numColumns={2} estimatedItemSize={200} scrollEnabled={false} />
              ) : (
                <View style={styles.emptyContainer}><Text style={styles.emptyText}>No users found.</Text></View>
              )}
            </View>
          )}
        </ScrollView>
      )}
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
  searchingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lottie: { width: 200, height: 200 },
  searchingText: { color: COLORS.textWhite, marginTop: 20, fontSize: 16, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textGray, fontSize: 15 }
});

export default HomeScreen;
