import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { MessageCircle, Search, X } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';
import api from '../../services/api';
import socketService from '../../services/socketService';
import { useNavigation } from '@react-navigation/native';

const ChatListScreen = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchConversations();
    
    if (socketService.socket) {
      socketService.socket.on('newMessage', (message) => {
        fetchConversations(); // Reload list to bump up the latest chat
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('newMessage');
      }
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('user/chat/conversations');
      setConversations(res.data || []);
    } catch (err) {
      console.log('Error fetching conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const otherParticipant = c.participants.find(p => p._id !== socketService.socket?.userId) || c.participants[0];
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }) => {
    const otherParticipant = item.participants.find(p => p._id !== socketService.socket?.userId) || item.participants[0];
    const avatar = otherParticipant?.profilePicture || otherParticipant?.profileImage || 'https://via.placeholder.com/150';
    const lastMsg = item.lastMessage?.text || (item.lastMessage?.image ? '📸 Image' : (item.lastMessage?.type === 'video' ? '🎥 Video' : 'Start a conversation'));

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Chat', { recipient: otherParticipant, conversationId: item._id })}
      >
        <View style={styles.avatarContainer}>
           <Image source={{ uri: avatar }} style={styles.avatar} />
           {otherParticipant?.status === 'Online' && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.info}>
           <Text style={styles.name}>{otherParticipant?.name || 'User'}</Text>
           <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg}</Text>
        </View>
        <View style={styles.meta}>
           <Text style={styles.time}>
             {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
           </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search chats..."
              placeholderTextColor={COLORS.textGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={styles.closeBtn}>
              <X color={COLORS.textWhite} size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>Messages</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearching(true)}>
              <Search color={COLORS.textWhite} size={22} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
             <MessageCircle color={COLORS.primary} size={40} />
          </View>
          <Text style={styles.emptyTitle}>{isSearching ? 'No match found' : 'No messages yet'}</Text>
          <Text style={styles.emptySub}>{isSearching ? 'Try another name' : 'When you chat with someone, it will appear here.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm, minHeight: 60 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textWhite },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardBackground, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, borderRadius: 20, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.2)' },
  searchInput: { flex: 1, color: COLORS.textWhite, fontSize: 16 },
  closeBtn: { padding: 5 },
  list: { padding: SPACING.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 55, height: 55, borderRadius: 27.5 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.cardBackground },
  info: { flex: 1, justifyContent: 'center' },
  name: { color: COLORS.textWhite, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  lastMsg: { color: COLORS.textGray, fontSize: 13 },
  meta: { alignItems: 'flex-end', justifyContent: 'flex-start', height: '100%', paddingTop: 5 },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(159, 103, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: COLORS.textGray, fontSize: 14, textAlign: 'center', lineHeight: 20 }
});

export default ChatListScreen;