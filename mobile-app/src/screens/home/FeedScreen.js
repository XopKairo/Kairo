import React, { useState, useEffect } from 'react';
import { Avatar } from 'react-native-paper';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { Camera, Plus, X, Heart, MessageCircle, Star } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const FeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await api.get(`/posts`);
      setPosts(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const createPost = async () => {
    if (!selectedImage) return;
    setIsPosting(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('caption', newCaption.trim());
      
      const filePayload = {
        uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
        name: selectedImage.fileName || `story_${Date.now()}.jpg`,
        type: selectedImage.mimeType || 'image/jpeg'
      };

      formData.append('image', filePayload);

      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setModalVisible(false);
      setNewCaption('');
      setSelectedImage(null);
      handleRefresh();
      Alert.alert('Success', 'Your story is live!');
    } catch (error) {
      Alert.alert('Upload Failed', 'Check your connection.');
    } finally {
      setIsPosting(false);
    }
  };

  const renderPost = ({ item }) => {
    const authorName = item.userId?.name || item.userId?.nickname || 'Zora User';
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Avatar.Image size={40} source={{ uri: item.userId?.profilePicture || "https://ui-avatars.com/api/?name=User" || 'https://via.placeholder.com/40' }} />
          <View style={styles.headerInfo}>
             <Text style={styles.authorName}>{authorName} {item.userId?.isVerified && <Star size={12} fill={COLORS.accentGlow} color={COLORS.accentGlow} />}</Text>
             <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          </View>
        </View>
        {item.mediaUrl && <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />}
        <View style={styles.postFooter}>
          <Text style={styles.caption}><Text style={{fontWeight: 'bold', color: COLORS.textWhite}}>{authorName}</Text> {item.caption}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>STORIES</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus color="#FFF" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          renderItem={renderPost}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No active stories.</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Story</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X color={COLORS.textWhite} size={24} /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.selectedImg} /> : (
                    <View style={{alignItems: 'center'}}><Camera color={COLORS.primary} size={40} /><Text style={styles.placeholderText}>Select Media</Text></View>
                )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Add a caption..."
              placeholderTextColor="#6B7280"
              value={newCaption}
              onChangeText={setNewCaption}
              multiline
            />
            <ZoraButton title="Post Now" onPress={createPost} loading={isPosting} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default FeedScreen;
