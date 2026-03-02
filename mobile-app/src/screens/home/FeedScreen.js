import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Post State
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
      console.error('Error fetching feed:', error);
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
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const createPost = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image for your story.');
      return;
    }

    setIsPosting(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      // Prepare FormData for upload (React Native compatible)
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('caption', newCaption.trim());
      
      const uriParts = selectedImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: selectedImage.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });

      // Execute POST request to backend
      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        setModalVisible(false);
        setNewCaption('');
        setSelectedImage(null);
        handleRefresh(); 
        Alert.alert('Success', 'Your story is now live for 24 hours!');
      }
    } catch (error) {
      console.error('Post creation failed:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Check your connection and try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const renderPost = ({ item }) => {
    const authorName = item.userId?.name || item.userId?.nickname || 'Anonymous';
    const isVerified = item.userId?.isVerified;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
             <Text style={styles.authorName}>
               {authorName}
               {isVerified && <Text style={styles.blueTick}> ✓</Text>}
             </Text>
             {item.isFeatured && (
               <View style={styles.featuredBadge}>
                 <Icon name="star" size={12} color="#FFF" />
                 <Text style={styles.featuredText}>Featured</Text>
               </View>
             )}
          </View>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>

        {item.mediaUrl ? (
          <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
        ) : null}

        <View style={styles.postFooter}>
          <Text style={styles.caption}>
            <Text style={styles.captionAuthor}>{authorName} </Text>
            {item.caption}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item._id}
        renderItem={renderPost}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No active stories. Be the first to post!</Text>}
      />

      {/* Create Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Story (24h)</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Posts disappear after 24 hours.</Text>
            
            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                {selectedImage ? (
                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImg} />
                ) : (
                    <View style={styles.placeholderContent}>
                        <Icon name="camera-plus" size={40} color="#8A2BE2" />
                        <Text style={styles.placeholderText}>Tap to select image</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="What's happening? (Caption)"
              multiline
              value={newCaption}
              onChangeText={setNewCaption}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.postBtn, (isPosting || !selectedImage) && { opacity: 0.7 }]} 
                onPress={createPost}
                disabled={isPosting || !selectedImage}
              >
                {isPosting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.postBtnText}>Post Story</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  addBtn: {
    backgroundColor: '#8A2BE2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { padding: 15 },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  headerInfo: { flex: 1 },
  authorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  blueTick: { color: '#007BFF' },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    alignSelf: 'flex-start'
  },
  featuredText: { fontSize: 10, fontWeight: 'bold', color: '#FFF', marginLeft: 2 },
  timeText: { fontSize: 12, color: '#999' },
  postImage: { width: '100%', height: 300, resizeMode: 'cover' },
  postFooter: { padding: 15 },
  caption: { fontSize: 15, color: '#444', lineHeight: 22 },
  captionAuthor: { fontWeight: 'bold', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    minHeight: 450,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3E5F5',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1C4E9',
    borderStyle: 'dashed'
  },
  placeholderContent: { alignItems: 'center' },
  placeholderText: { marginTop: 10, color: '#8A2BE2', fontWeight: 'bold' },
  selectedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  modalActions: { flexDirection: 'row', justifyContent: 'center' },
  postBtn: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 4
  },
  postBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default FeedScreen;
