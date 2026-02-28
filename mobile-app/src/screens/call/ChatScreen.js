import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import io from 'socket.io-client';

const SOCKET_URL = 'https://kairo-b1i9.onrender.com';

const ChatScreen = ({ route, navigation }) => {
  const { contactId, contactName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isContactOnline, setIsContactOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ 
      title: contactName,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isContactOnline && <View style={styles.onlineIndicator} />}
            <Text style={{ color: isContactOnline ? 'green' : 'gray', marginRight: 10 }}>
              {isContactOnline ? 'Online' : 'Offline'}
            </Text>
        </View>
      )
    });

    initChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [contactId, isContactOnline]);

  const initChat = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        
        // Fetch history
        fetchHistory(user.id);

        // Setup Socket
        socketRef.current = io(SOCKET_URL);
        
        socketRef.current.on('connect', () => {
          socketRef.current.emit('registerUser', user.id);
        });

        socketRef.current.on('receiveMessage', (message) => {
          // Check if message belongs to this conversation
          if ((message.senderId === contactId && message.receiverId === user.id) ||
              (message.senderId === user.id && message.receiverId === contactId)) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
          }
        });

        socketRef.current.on('userStatusChanged', (data) => {
          if (data.userId === contactId) {
            setIsContactOnline(data.status === 'online');
          }
        });

        socketRef.current.on('userTyping', (data) => {
          if (data.senderId === contactId) {
            setIsTyping(data.isTyping);
          }
        });
      }
    } catch (error) {
      console.error('Failed to init chat', error);
    }
  };

  const fetchHistory = async (userId) => {
    try {
      const res = await api.get(`/chat/${userId}/${contactId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !currentUserId) return;

    const messageData = {
      senderId: currentUserId,
      receiverId: contactId,
      content: inputText.trim()
    };

    // Emit via socket
    socketRef.current.emit('sendMessage', messageData);
    
    setInputText('');
    handleStopTyping();
  };

  const handleTyping = (text) => {
    setInputText(text);
    if (!currentUserId || !socketRef.current) return;

    socketRef.current.emit('typing', { senderId: currentUserId, receiverId: contactId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1500);
  };

  const handleStopTyping = () => {
    if (currentUserId && socketRef.current) {
        socketRef.current.emit('typing', { senderId: currentUserId, receiverId: contactId, isTyping: false });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const reportMessage = async (msgId) => {
    Alert.prompt(
      'Report Message',
      'Reason for reporting:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async (reason) => {
            if(!reason) return;
            try {
              await api.post(`/chat/report`, {
                reporterId: currentUserId,
                reportedUserId: contactId,
                messageId: msgId,
                reason: reason
              });
              Alert.alert('Reported', 'Message has been reported to admins.');
            } catch (e) {
               Alert.alert('Error', 'Failed to report message.');
            }
          } 
        }
      ],
      'plain-text'
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <TouchableOpacity onLongPress={() => !isMe && reportMessage(item._id)}>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id || Math.random().toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
      />
      
      {isTyping && (
        <Text style={styles.typingIndicator}>{contactName} is typing...</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8A2BE2',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: '#333',
  },
  typingIndicator: {
    paddingHorizontal: 15,
    paddingBottom: 5,
    color: 'gray',
    fontStyle: 'italic',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EAEAEA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    paddingHorizontal: 15,
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'green',
    marginRight: 5,
  }
});

export default ChatScreen;
