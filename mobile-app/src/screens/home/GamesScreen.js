import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, SafeAreaView, Dimensions, Alert, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronLeft, Trophy, Play, Users, Coins } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme/theme';

const { width } = Dimensions.get('window');

const GamesScreen = ({ navigation }) => {
  const [matching, setMatching] = useState(false);

  const handleStartLudo = () => {
    setMatching(true);
    setTimeout(() => {
      setMatching(false);
      Alert.alert('Elite Ludo', 'Matching found! Connecting to host Aisha...');
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ZORA GAMES</Text>
        <View style={styles.coinBadge}>
           <Coins color="#FFD700" size={14} />
           <Text style={styles.coinText}>500</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {matching ? (
          <View style={styles.matchmaking}>
             <LottieView 
               source={{ uri: 'https://assets10.lottiefiles.com/packages/lf20_m9ubts9m.json' }} 
               autoPlay 
               loop 
               style={styles.lottie} 
             />
             <Text style={styles.matchText}>Searching for an opponent...</Text>
             <Text style={styles.matchSub}>Elite hosts are ready to play!</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
               <LinearGradient colors={['#6366F1', '#A855F7']} style={styles.heroGradient}>
                  <Trophy color="#FFF" size={50} style={styles.heroIcon} />
                  <View>
                     <Text style={styles.heroTitle}>Elite Ludo</Text>
                     <Text style={styles.heroSubtitle}>Play & Win Real Coins</Text>
                  </View>
               </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Available Games</Text>

            <TouchableOpacity style={styles.gameCard} onPress={handleStartLudo}>
               <View style={styles.gameIconBox}>
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3501/3501141.png' }} style={styles.ludoIcon} />
               </View>
               <View style={styles.gameInfo}>
                  <Text style={styles.gameTitle}>Classic Ludo</Text>
                  <View style={styles.tagRow}>
                     <View style={styles.gameTag}><Users size={12} color={COLORS.primary} /><Text style={styles.tagText}>2-4 Players</Text></View>
                     <View style={styles.gameTag}><Coins size={12} color="#FFD700" /><Text style={styles.tagText}>Entry: 50</Text></View>
                  </View>
               </View>
               <View style={styles.playIcon}><Play color="#FFF" size={20} fill="#FFF" /></View>
            </TouchableOpacity>

            <View style={[styles.gameCard, { opacity: 0.6 }]}>
               <View style={[styles.gameIconBox, { backgroundColor: '#333' }]}>
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3501/3501141.png' }} style={styles.ludoIcon} />
               </View>
               <View style={styles.gameInfo}>
                  <Text style={styles.gameTitle}>Spin the Wheel</Text>
                  <Text style={styles.comingSoon}>LOCKED</Text>
               </View>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  coinText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  content: { padding: SPACING.lg },
  heroCard: { height: 120, borderRadius: 24, overflow: 'hidden', marginBottom: 30 },
  heroGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 25 },
  heroIcon: { marginRight: 20 },
  heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  gameCard: { backgroundColor: COLORS.cardBackground, borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  gameIconBox: { width: 70, height: 70, borderRadius: 18, backgroundColor: 'rgba(108, 43, 217, 0.1)', justifyContent: 'center', alignItems: 'center' },
  ludoIcon: { width: 45, height: 45 },
  gameInfo: { flex: 1, marginLeft: 15 },
  gameTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  gameTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  tagText: { color: COLORS.textGray, fontSize: 10, fontWeight: '600' },
  playIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  comingSoon: { color: COLORS.textGray, fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  matchmaking: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  lottie: { width: 250, height: 250 },
  matchText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  matchSub: { color: COLORS.textGray, marginTop: 10 }
});

export default GamesScreen;

