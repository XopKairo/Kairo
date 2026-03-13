import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronLeft, Gift, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SPACING } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ScratchCardScreen = ({ navigation }) => {
  const { showAlert } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scratching, setScratching] = useState(null);

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    try {
      const res = await api.get('/vip/scratch-cards');
      setCards(res.data);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const handleScratch = async (card) => {
    setScratching(card._id);
    try {
      const res = await api.post('/vip/scratch', { cardId: card._id });
      if (res.data.success) {
        showAlert('Congratulations!', `You won ${res.data.reward} coins!`, 'success', 'AWESOME', [
          { text: 'Awesome', onPress: fetchCards }
        ]);
      }
    } catch (error) {
      showAlert('Error', 'Failed to scratch card. Try again.', 'error');
    } finally { setScratching(null); }
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ChevronLeft color="#FFF" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>SCRATCH & WIN</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
           <Sparkles color="#FFD700" size={32} />
           <Text style={styles.infoText}>Recharge more to get more scratch cards and win bonus coins!</Text>
        </View>

        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
             <Gift color={COLORS.textGray} size={80} style={{ opacity: 0.3 }} />
             <Text style={styles.emptyText}>No scratch cards available.</Text>
             <TouchableOpacity style={styles.rechargeBtn} onPress={() => navigation.navigate('Wallet')}><Text style={styles.rechargeBtnText}>Recharge Now</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardGrid}>
             {cards.map((card) => (
               <TouchableOpacity key={card._id} style={styles.cardItem} onPress={() => handleScratch(card)} disabled={scratching === card._id}>
                  <LinearGradient colors={['#4B5563', '#1F2937']} style={styles.cardBg}>
                     <Gift color="#FFF" size={40} />
                     <Text style={styles.tapText}>Tap to Scratch</Text>
                     {scratching === card._id && <ActivityIndicator color="#FFF" style={{ marginTop: 10 }} />}
                  </LinearGradient>
               </TouchableOpacity>
             ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  content: { padding: SPACING.lg },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  infoText: { color: COLORS.textWhite, flex: 1, fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textGray, fontSize: 16, marginTop: 20, textAlign: 'center' },
  rechargeBtn: { marginTop: 30, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  rechargeBtnText: { color: '#FFF', fontWeight: 'bold' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
  cardItem: { width: (width - 60) / 2, height: 180, borderRadius: 20, overflow: 'hidden', elevation: 5 },
  cardBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tapText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 }
});

export default ScratchCardScreen;
