import React, { useState, useEffect, useMemo } from 'react';
import { Avatar } from 'react-native-paper';
import { 
  View, 
  Text, 
  StyleSheet, 
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
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { Camera, Plus, X, Star } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';

const PostCard = React.memo(({ item }) => {
  const authorName = item.userId?.name || item.userId?.nickname || 'Zora User';
  const profilePic = item.userId?.profilePicture || `https://ui-avatars.com/api/?name=${authorName}`;
  
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar.Image size={40} source={{ uri: profilePic }} />
        <View style={styles.headerInfo}>
           <Text style={styles.authorName}>{authorName} {item.userId?.isVerified && <Star size={12} fill={COLORS.accentGlow} color={COLORS.accentGlow} />}</Text>
           <Text style={styles.timeText}>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</Text>
        </View>
      </View>
      {item.mediaUrl ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}
      <View style={styles.postFooter}>
        <Text style={styles.caption}><Text style={{fontWeight: 'bold', color: COLORS.textWhite}}>{authorName}</Text> {item.caption}</Text>
      </View>
    </View>
  );
});

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
      setPosts(response.data || []);
    } catch (error) {
      console.error('Feed error:', error);
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
      aspect: [4, 5],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const createPost = async () => {
    if (!selectedImage) return Alert.alert('Error', 'Please select an image');
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
        name: selectedImage.fileName || `post_${Date.now()}.jpg`,
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
        <View style={{ flex: 1 }}>
          <FlashList
            data={posts}
            keyExtractor={item => item._id || Math.random().toString()}
            renderItem={({ item }) => <PostCard item={item} />}
            estimatedItemSize={400}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={<Text style={styles.emptyText}>No active stories.</Text>}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  headerTitle: { color: COLORS.textWhite, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingBottom: 100 },
  postCard: { backgroundColor: COLORS.cardBackground, marginBottom: 15, borderRadius: 20, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  headerInfo: { marginLeft: 12 },
  authorName: { color: COLORS.textWhite, fontSize: 15, fontWeight: '700', flexDirection: 'row', alignItems: 'center' },
  timeText: { color: COLORS.textGray, fontSize: 11, marginTop: 2 },
  postImage: { width: '100%', height: 400 },
  postFooter: { padding: 15 },
  caption: { color: COLORS.textGray, fontSize: 14, lineHeight: 20 },
  emptyText: { color: COLORS.textGray, textAlign: 'center', marginTop: 100, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING.lg, minHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: 'bold' },
  imagePlaceholder: { width: '100%', height: 300, backgroundColor: COLORS.cardBackground, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  selectedImg: { width: '100%', height: '100%' },
  placeholderText: { color: COLORS.textGray, marginTop: 10 },
  input: { backgroundColor: COLORS.cardBackground, borderRadius: 15, padding: 15, color: COLORS.textWhite, marginBottom: 20, textAlignVertical: 'top', minHeight: 80 }
});

export default FeedScreen;
