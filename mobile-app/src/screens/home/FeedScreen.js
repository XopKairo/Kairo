import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



const FeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Post State
  const [modalVisible, setModalVisible] = useState(false);
  const [newCaption, setNewCaption] = useState('');
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

  const createPost = async () => {
    if (!newCaption.trim()) {
      Alert.alert('Error', 'Please enter a caption for your story.');
      return;
    }

    setIsPosting(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user.id) {
        Alert.alert('Error', 'User not found. Please log in.');
        return;
      }

      // Simulated image URL for demonstration (in a real app, use expo-image-picker and upload to S3/Cloudinary)
      const dummyImage = `https://picsum.photos/400/300?random=${Math.random()}`;

      await api.post(`/posts`, {
        userId: user.id,
        mediaUrl: dummyImage,
        caption: newCaption
      });

      setModalVisible(false);
      setNewCaption('');
      handleRefresh(); // Refresh feed to show new post
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create story.');
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
            <Text style={styles.modalTitle}>New Story (24h)</Text>
            <Text style={styles.modalSubtitle}>Posts disappear after 24 hours.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="What's happening?"
              multiline
              value={newCaption}
              onChangeText={setNewCaption}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.postBtn, isPosting && { opacity: 0.7 }]} 
                onPress={createPost}
                disabled={isPosting}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#8A2BE2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  blueTick: {
    color: '#007BFF',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  postFooter: {
    padding: 15,
  },
  caption: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  captionAuthor: {
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postBtn: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  postBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default FeedScreen;
