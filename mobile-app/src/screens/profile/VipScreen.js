import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronLeft, Crown, CheckCircle2, Star, Zap, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SPACING } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const VipScreen = ({ navigation }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/vip/packages');
      setPackages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyVip = async (pkg) => {
    Alert.alert(
      'Activate VIP',
      `Unlock ${pkg.name} benefits for ${pkg.durationDays} days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            setBuying(true);
            try {
              const res = await api.post('/vip/buy-vip', { packageId: pkg._id });
              if (res.data.success) {
                Alert.alert('Success!', res.data.message);
                navigation.goBack();
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to activate VIP');
            } finally {
              setBuying(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIP CLUB</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Banner */}
        <LinearGradient colors={['#FCD34D', '#F59E0B', '#D97706']} style={styles.vipBanner}>
           <Crown color="#FFF" size={60} fill="#FFF" style={styles.bannerIcon} />
           <Text style={styles.bannerTitle}>Join the Elite Circle</Text>
           <Text style={styles.bannerSubtitle}>Get exclusive badges, priority calls and daily rewards!</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Choose your Plan</Text>

        {packages.map((pkg) => (
          <TouchableOpacity key={pkg._id} style={styles.pkgCard} onPress={() => handleBuyVip(pkg)}>
             <View style={styles.pkgHeader}>
                <View>
                   <Text style={styles.pkgName}>{pkg.name}</Text>
                   <Text style={styles.pkgDuration}>{pkg.durationDays} Days Membership</Text>
                </View>
                <Text style={styles.pkgPrice}>₹{pkg.priceINR}</Text>
             </View>
             
             <View style={styles.divider} />
             
             <View style={styles.featureList}>
                {(pkg.features || ["Priority Profile", "Exclusive Badge", "Daily Bonus"]).map((feat, i) => (
                   <View key={i} style={styles.featureItem}>
                      <CheckCircle2 color={COLORS.primary} size={16} />
                      <Text style={styles.featureText}>{feat}</Text>
                   </View>
                ))}
             </View>

             <LinearGradient colors={[COLORS.primary, '#4C1D95']} style={styles.buyBtn}>
                <Text style={styles.buyBtnText}>Activate Now</Text>
             </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Perks Section */}
        <View style={styles.perksGrid}>
           <View style={styles.perkItem}>
              <View style={[styles.perkIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                 <Crown color="#F59E0B" size={24} />
              </View>
              <Text style={styles.perkTitle}>Elite Badge</Text>
              <Text style={styles.perkDesc}>Stand out from the crowd</Text>
           </View>
           <View style={styles.perkItem}>
              <View style={[styles.perkIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                 <Zap color="#10B981" size={24} />
              </View>
              <Text style={styles.perkTitle}>Fast Track</Text>
              <Text style={styles.perkDesc}>No waiting for calls</Text>
           </View>
           <View style={styles.perkItem}>
              <View style={[styles.perkIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                 <ShieldCheck color="#3B82F6" size={24} />
              </View>
              <Text style={styles.perkTitle}>Incognito</Text>
              <Text style={styles.perkDesc}>Hide your status</Text>
           </View>
        </View>

      </ScrollView>
      {buying && <View style={styles.overlay}><ActivityIndicator size="large" color="#FFF" /></View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  content: { padding: SPACING.lg },
  vipBanner: { padding: 30, borderRadius: 30, alignItems: 'center', marginBottom: 30 },
  bannerIcon: { marginBottom: 15 },
  bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 10 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  pkgCard: { backgroundColor: COLORS.cardBackground, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pkgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgName: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  pkgDuration: { color: COLORS.textGray, fontSize: 12, marginTop: 4 },
  pkgPrice: { color: '#FCD34D', fontSize: 24, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 15 },
  featureList: { gap: 10, marginBottom: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { color: COLORS.textGray, fontSize: 14 },
  buyBtn: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  perksGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15, marginTop: 20 },
  perkItem: { width: '30%', alignItems: 'center' },
  perkIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  perkTitle: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  perkDesc: { color: COLORS.textGray, fontSize: 10, textAlign: 'center', marginTop: 4 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }
});

export default VipScreen;
