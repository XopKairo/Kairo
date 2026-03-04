import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import api from '../../services/api';
import { Search, UserPlus, MapPin, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';

const DiscoveryScreen = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={[styles.avatar, { backgroundColor: item.gender === 'Female' ? '#E91E63' : '#6C2BD9' }]}>
        <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? COLORS.success : '#555' }]} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name} {item.isVerified && <ShieldCheck size={14} color={COLORS.accentGlow} />}</Text>
        <View style={styles.detailRow}>
           <MapPin size={12} color={COLORS.textGray} />
           <Text style={styles.userDetail}>{item.location || 'Global'}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.connectBtn}>
        <UserPlus color={COLORS.textWhite} size={18} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>DISCOVERY</Text>
        <View style={styles.searchBar}>
          <Search color={COLORS.textGray} size={20} />
          <TextInput
            style={styles.input}
            placeholder="Search elite members..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  center: { flex: 1, justifyContent: 'center' },
  header: { padding: SPACING.lg },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textWhite, letterSpacing: 2, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  input: { flex: 1, marginLeft: 10, color: COLORS.textWhite, fontSize: 15 },
  list: { paddingHorizontal: SPACING.lg },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: COLORS.cardBackground },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { color: COLORS.textWhite, fontSize: 16, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  userDetail: { color: COLORS.textGray, fontSize: 12 },
  connectBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textGray }
});

export default DiscoveryScreen;
