import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, SafeAreaView, StatusBar } from 'react-native';
import { Bell, Info, Coins, ShieldAlert } from 'lucide-react-native';
import socketService from '../../services/socketService';
import { COLORS, SPACING } from '../../theme/theme';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'System', description: 'Welcome to ZORA Premium Experience.', type: 'system', createdAt: new Date() }
  ]);

  useEffect(() => {
    if (socketService.socket) {
      socketService.socket.on('walletUpdate', (data) => {
        const newNotif = {
          id: Date.now().toString(),
          title: 'Wallet Updated',
          description: data.message,
          type: 'wallet',
          createdAt: new Date()
        };
        setNotifications(prev => [newNotif, ...prev]);
      });
    }
    return () => {
      if (socketService.socket) socketService.socket.off('walletUpdate');
    };
  }, []);

  const renderIcon = (type) => {
    switch(type) {
      case 'wallet': return <Coins color={COLORS.accentGlow} size={22} />;
      case 'alert': return <ShieldAlert color={COLORS.error} size={22} />;
      default: return <Info color={COLORS.primary} size={22} />;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.notifCard}>
      <View style={styles.iconContainer}>{renderIcon(item.type)}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No new notifications.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { padding: SPACING.lg },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textWhite, letterSpacing: 2 },
  list: { padding: SPACING.lg },
  notifCard: { flexDirection: 'row', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginLeft: 15 },
  title: { color: COLORS.textWhite, fontSize: 16, fontWeight: '700' },
  desc: { color: COLORS.textGray, fontSize: 13, marginTop: 4, lineHeight: 18 },
  time: { color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 8 },
  emptyText: { textAlign: 'center', color: COLORS.textGray, marginTop: 50 }
});

export default NotificationsScreen;
