import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { ChevronLeft, Coins, PhoneCall, Wallet, TrendingUp, Clock } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const HistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('coins'); // 'coins', 'calls', 'earnings'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ calls: [], ledger: [], hostEarnings: [] });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('user/wallet/history');
      if (res.data.success) {
        setData({
          calls: res.data.calls || [],
          ledger: res.data.ledger || [],
          hostEarnings: res.data.hostEarnings || []
        });
      }
    } catch (err) {
      console.log('Error fetching history', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTab = (key, label, Icon) => {
    if (key === 'earnings' && !user?.isHost) return null;
    const isActive = activeTab === key;
    return (
      <TouchableOpacity 
        style={[styles.tab, isActive && styles.activeTab]} 
        onPress={() => setActiveTab(key)}
      >
        <Icon color={isActive ? '#FFF' : COLORS.textGray} size={16} />
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textWhite} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTab('coins', 'Coins', Coins)}
        {renderTab('calls', 'Calls', PhoneCall)}
        {renderTab('earnings', 'Earnings', TrendingUp)}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'coins' && data.ledger.map((item, idx) => (
            <View key={item._id || idx} style={styles.historyCard}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBox, { backgroundColor: item.type === 'credit' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                  <Wallet color={item.type === 'credit' ? COLORS.success : COLORS.error} size={20} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{item.description || item.transactionType}</Text>
                  <Text style={styles.cardTime}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
              <Text style={[styles.amountText, { color: item.type === 'credit' ? COLORS.success : COLORS.error }]}>
                {item.type === 'credit' ? '+' : '-'}{item.amount}
              </Text>
            </View>
          ))}

          {activeTab === 'calls' && data.calls.map((item, idx) => (
            <View key={item._id || idx} style={styles.historyCard}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                  <PhoneCall color={COLORS.primary} size={20} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Call with {item.hostId?.name || 'Unknown'}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4}}>
                     <Clock color={COLORS.textGray} size={12} />
                     <Text style={styles.cardTime}>{item.durationInMinutes || 0} mins</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.amountText, { color: COLORS.error }]}>-{item.coinsDeducted || 0}</Text>
            </View>
          ))}

          {activeTab === 'earnings' && data.hostEarnings.map((item, idx) => (
            <View key={item._id || idx} style={styles.historyCard}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <TrendingUp color={COLORS.success} size={20} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Call from {item.userId?.name || 'User'}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4}}>
                     <Clock color={COLORS.textGray} size={12} />
                     <Text style={styles.cardTime}>{item.durationInMinutes || 0} mins</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.amountText, { color: COLORS.success }]}>+{item.hostEarning || 0}</Text>
            </View>
          ))}
          
          <View style={{height: 50}} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  backBtn: { marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textWhite },
  tabContainer: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, gap: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.cardBackground, gap: 6, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  activeTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textGray, fontSize: 13, fontWeight: 'bold' },
  activeTabText: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: SPACING.lg },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(159, 103, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: COLORS.textWhite, fontSize: 14, fontWeight: 'bold' },
  cardTime: { color: COLORS.textGray, fontSize: 11 },
  amountText: { fontSize: 16, fontWeight: '900' }
});

export default HistoryScreen;