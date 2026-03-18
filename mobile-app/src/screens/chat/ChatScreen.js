import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TextInput, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Send, ChevronLeft, ImagePlus, Check, CheckCheck, Video as VideoIcon, Gift } from 'lucide-react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import api, { BASE_URL } from '../../services/api';
import { uploadMedia } from '../../services/mediaService';

const ChatScreen = ({ route, navigation }) => {
  const { recipient, conversationId: initialConvId } = route.params || {};
  const { user, showAlert } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [availableGifts, setAvailableGifts] = useState([]);
  const flatListRef = useRef();

  useEffect(() => {
    if (!recipient) return;
    fetchMessages();
    fetchGifts();

    if (socketService.socket) {
      socketService.socket.on('newMessage', (message) => {
        setMessages(prev => {
          // If message is for this conversation
          return [...prev, message];
        });
      });

      socketService.socket.on('messageStatusUpdate', ({ messageId, status }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
      });

      socketService.socket.on('userTyping', () => setIsTyping(true));
      socketService.socket.on('userStoppedTyping', () => setIsTyping(false));
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('newMessage');
        socketService.socket.off('messageStatusUpdate');
        socketService.socket.off('userTyping');
        socketService.socket.off('userStoppedTyping');
      }
    };
  }, [recipient]);

  const fetchGifts = async () => {
    try {
      const res = await api.get('user/interactions/gifts');
      setAvailableGifts(res.data || []);
    } catch (e) { console.log("Failed to fetch gifts", e); }
  };

  const sendGift = async (gift) => {
    try {
      const actualRecipientId = recipient.userId?._id || recipient.userId || recipient.id || recipient._id;
      await api.post('user/interactions/send-gift', { giftId: gift._id, receiverId: actualRecipientId });
      
      const messageData = {
        recipientId: actualRecipientId,
        text: `🎁 Sent you a ${gift.name}`,
        type: 'gift',
        conversationId: initialConvId,
      };

      if (socketService.socket) {
        socketService.socket.emit('privateMessage', messageData);
      }

      await api.post(`user/chat/send`, messageData);
      setMessages(prev => [...prev, { ...messageData, _id: Date.now().toString(), sender: user._id || user.id, createdAt: new Date(), status: 'sent' }]);
      setShowGifts(false);
      if(showAlert) showAlert('Success', `Gift ${gift.name} sent!`, 'success');
    } catch (e) {
      if(showAlert) showAlert('Error', e.response?.data?.message || 'Failed to send gift', 'error');
    }
  };

  const fetchMessages = async () => {
    if (!initialConvId) return;
    try {
      const response = await api.get(`user/chat/messages/${initialConvId}`);
      setMessages(response.data);
    } catch (error) {
      console.log('Failed to fetch messages', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !recipient) return;

    const actualRecipientId = recipient.userId?._id || recipient.userId || recipient.id || recipient._id;

    const messageData = {
      recipientId: actualRecipientId,
      text: inputText,
      conversationId: initialConvId,
      type: 'text'
    };

    if (socketService.socket) {
      socketService.socket.emit('privateMessage', messageData);
    }

    try {
      const res = await api.post(`user/chat/send`, messageData);
      setMessages(prev => [...prev, { ...messageData, _id: res.data?.message?._id || Date.now(), sender: user._id || user.id, createdAt: new Date(), status: 'sent' }]);
      setInputText('');
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data?.requiresRecharge) {
        if(showAlert) showAlert('Insufficient Coins', error.response.data.message, 'error', 'RECHARGE', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Recharge', onPress: () => navigation.navigate('Wallet') }
        ]);
      } else {
        console.log('Failed to send message', error);
      }
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      videoMaxDuration: 30,
      allowsEditing: true,
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      sendMediaMessage(result.assets[0]);
    }
  };

  const sendMediaMessage = async (asset) => {
    const actualRecipientId = recipient.userId?._id || recipient.userId || recipient.id || recipient._id;
    setIsUploading(true);
    try {
      const base64Str = `data:image/jpeg;base64,${asset.base64}`;
      const isVideo = asset.type === 'video';
      // Note: base64 for video might be heavy or not supported easily. For now assume uploadMedia handles it or it's an image. If video, we might need a different upload logic, but we'll try to use uploadMedia with base64 or local uri.
      let mediaUrl = '';
      if(isVideo) { mediaUrl = await uploadMedia(asset.uri, 'video'); }
      else { mediaUrl = await uploadMedia(base64Str, 'image'); }
      
      const messageData = {
        recipientId: actualRecipientId,
        text: '',
        image: mediaUrl,
        type: isVideo ? 'video' : 'image',
        conversationId: initialConvId,
      };

      if (socketService.socket) {
        socketService.socket.emit('privateMessage', messageData);
      }

      const res = await api.post(`user/chat/send`, messageData);
      setMessages(prev => [...prev, { ...messageData, _id: res.data?.message?._id || Date.now(), sender: user._id || user.id, createdAt: new Date(), status: 'sent' }]);
    } catch (error) {
       console.log("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const currentUserId = user?._id || user?.id;
    const messageSenderId = item.sender?._id || item.sender;
    const isMe = messageSenderId === currentUserId;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {((item.type === 'image' || item.image) && item.image !== null && item.image !== 'null' && item.type !== 'video') ? (
            <Image source={{ uri: item.image }} style={styles.messageImage} resizeMode="cover" />
          ) : (item.type === 'video' && item.image !== null && item.image !== 'null') ? (
             <Video source={{ uri: item.image }} style={styles.messageImage} useNativeControls resizeMode="cover" isLooping />
          ) : null}
          
          {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}
          
          <View style={styles.messageFooter}>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <View style={styles.statusIcon}>
                {item.status === 'read' ? (
                   <CheckCheck size={14} color="#3B82F6" />
                ) : item.status === 'delivered' ? (
                   <CheckCheck size={14} color="rgba(255,255,255,0.5)" />
                ) : (
                   <Check size={14} color="rgba(255,255,255,0.5)" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!recipient) return null;

  const recipientAvatar = recipient.profilePicture || recipient.profileImage || recipient.avatar || 'https://ui-avatars.com/api/?name=' + (recipient.name || 'User') + '&background=random';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textWhite} size={28} />
        </TouchableOpacity>
        
        <View style={styles.avatarContainer}>
          <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{recipient.name}</Text>
          <Text style={styles.headerStatus}>{isTyping ? 'typing...' : 'Online'}</Text>
        </View>
      </View>

      <Image 
        source={{ uri: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png' }} 
        style={[StyleSheet.absoluteFill, { opacity: 0.05, tintColor: COLORS.primary }]} 
        resizeMode="repeat"
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <Modal visible={showGifts} transparent animationType="slide">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}} onPress={() => setShowGifts(false)} />
        <View style={{backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '50%', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)'}}>
          <Text style={{color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center'}}>Send a Gift</Text>
          <FlatList 
            data={availableGifts}
            numColumns={4}
            renderItem={({item}) => (
              <TouchableOpacity style={{flex: 1, alignItems: 'center', marginBottom: 20}} onPress={() => sendGift(item)}>
                <Image source={{uri: item.iconUrl ? `${BASE_URL}/${item.iconUrl}` : 'https://via.placeholder.com/50'}} style={{width: 50, height: 50, marginBottom: 5}} />
                <Text style={{color: '#FFF', fontSize: 10}}>{item.name}</Text>
                <Text style={{color: COLORS.primary, fontSize: 10, fontWeight: 'bold'}}>{item.coinCost} 🪙</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item._id}
          />
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={() => setShowGifts(true)}>
            <Gift color={COLORS.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} disabled={isUploading}>
            {isUploading ? (
               <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
               <ImagePlus color={COLORS.textGray} size={24} />
            )}
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#6B7280"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Send color={COLORS.textWhite} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  backBtn: {
    marginRight: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  headerStatus: {
    color: COLORS.accentGlow,
    fontSize: 12,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: SPACING.sm,
    maxWidth: '85%',
    flexDirection: 'row', // Helps with alignSelf
  },
  myMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto', // Push to right
  },
  theirMessage: {
    alignSelf: 'flex-start',
    marginRight: 'auto', // Push to left
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#056162',
    borderTopRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#262d31',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  messageText: {
    color: COLORS.textWhite,
    fontSize: 15,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  statusIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  attachButton: {
    padding: 10,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    color: COLORS.textWhite,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default ChatScreen;