import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
import { Send, ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ChatScreen = ({ route, navigation }) => {
  const { recipient, conversationId: initialConvId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    fetchMessages();

    socketService.socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.socket.on('userTyping', () => setIsTyping(true));
    socketService.socket.on('userStoppedTyping', () => setIsTyping(false));

    return () => {
      socketService.socket.off('newMessage');
      socketService.socket.off('userTyping');
      socketService.socket.off('userStoppedTyping');
    };
  }, []);

  const fetchMessages = async () => {
    if (!initialConvId) return;
    try {
      const response = await api.get(`/chat/messages/${initialConvId}`);
      setMessages(response.data);
    } catch (error) {
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageData = {
      recipientId: recipient.id,
      text: inputText,
      conversationId: initialConvId,
    };

    // Emit via Socket for instant delivery
    socketService.socket.emit('privateMessage', messageData);

    // Save to DB via REST
    try {
      await api.post(`/chat/send`, messageData);
      setMessages(prev => [...prev, { ...messageData, sender: user.id, createdAt: new Date() }]);
      setInputText('');
    } catch (error) {
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === user.id;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textWhite} size={28} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{recipient.name}</Text>
          <Text style={styles.headerStatus}>{isTyping ? 'typing...' : 'Online'}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
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
    paddingTop: 60,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  headerInfo: {
    marginLeft: SPACING.sm,
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
  },
  messageWrapper: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: SPACING.md,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: COLORS.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  messageText: {
    color: COLORS.textWhite,
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    color: COLORS.textGray,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    color: COLORS.textWhite,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});

export default ChatScreen;
