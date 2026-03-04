import React, { useState, useEffect } from 'react';
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
  StatusBar
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
      
      const uriParts = selectedImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: selectedImage.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });

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
          <Avatar.Image size={40} source={{ uri: item.userId?.profilePicture || 'https://via.placeholder.com/40' }} />
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

// ... import Avatar from Paper separately or use custom
import { Avatar } from 'react-native-paper';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textWhite, letterSpacing: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: SPACING.md },
  postCard: { backgroundColor: COLORS.cardBackground, borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  headerInfo: { marginLeft: 12 },
  authorName: { color: COLORS.textWhite, fontSize: 15, fontWeight: '700' },
  timeText: { color: COLORS.textGray, fontSize: 11, marginTop: 2 },
  postImage: { width: '100%', height: 350 },
  postFooter: { padding: 15 },
  caption: { color: COLORS.textGray, fontSize: 14, lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textGray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: COLORS.textWhite, fontSize: 20, fontWeight: '800' },
  imagePlaceholder: { width: '100%', height: 250, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, justifyContent: 'center', marginBottom: 20 },
  placeholderText: { color: COLORS.textGray, marginTop: 10, fontWeight: '600' },
  selectedImg: { width: '100%', height: '100%', borderRadius: 20 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, color: COLORS.textWhite, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 }
});

export default FeedScreen;
