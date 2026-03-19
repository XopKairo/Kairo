import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Send, Image as ImageIcon } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';
import api from '../../services/api';
import { uploadMedia } from '../../services/mediaService';
import { useAuth } from '../../context/AuthContext';

const StoryUploadScreen = ({ navigation }) => {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAuth();

  const pickMedia = async (useCamera = false) => {
    let result;
    const options = {
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 30,
    };

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera access is required to take photos.', 'error');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!media) return;
    setLoading(true);
    try {
      // 1. Upload to Cloudinary
      const mediaUrl = await uploadMedia(media.uri, media.type);
      
      // 2. Create Story in Backend
      await api.post('user/stories/upload', {
        mediaUrl,
        mediaType: media.type,
        caption
      });

      showAlert('Success', 'Story posted successfully!', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Story upload failed:', error);
      showAlert('Error', 'Failed to post story. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X color="#FFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {media ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: media.uri }} style={styles.preview} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setMedia(null)}>
              <X color="#FFF" size={20} />
            </TouchableOpacity>
            
            <View style={styles.inputOverlay}>
              <TextInput
                style={styles.input}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <ImageIcon color={COLORS.primary} size={40} />
            </View>
            <Text style={styles.emptyText}>Share a moment with your fans</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => pickMedia(false)}>
                <ImageIcon color="#FFF" size={24} />
                <Text style={styles.btnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => pickMedia(true)}>
                <Camera color="#FFF" size={24} />
                <Text style={styles.btnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {media && (
        <TouchableOpacity 
          style={styles.uploadBtn} 
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.uploadText}>Post Story</Text>
              <Send color="#FFF" size={20} />
            </>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  previewContainer: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  removeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  inputOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 15,
  },
  input: {
    color: '#FFF',
    fontSize: 16,
    maxHeight: 100,
  },
  emptyState: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(159, 103, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.textGray,
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  uploadBtn: {
    margin: SPACING.lg,
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  uploadText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default StoryUploadScreen;