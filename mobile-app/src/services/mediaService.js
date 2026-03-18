import api from './api';
import { Platform } from 'react-native';

export const uploadMedia = async (fileData, type = 'image') => {
  try {
    // If it's a local URI (for video or image), use FormData
    if (fileData.startsWith('file://') || fileData.startsWith('content://')) {
      const formData = new FormData();
      formData.append('media', {
        uri: Platform.OS === 'android' ? fileData : fileData.replace('file://', ''),
        name: `upload_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
        type: type === 'video' ? 'video/mp4' : 'image/jpeg'
      });
      formData.append('type', type);
      
      const response = await api.post('user/users/upload-media-multipart', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } else {
      // Base64 upload
      const response = await api.post('user/users/upload-media', {
        file: fileData,
        type // 'image' or 'video'
      });
      return response.data.url;
    }
  } catch (error) {
    console.error('Media upload failed:', error);
    throw error;
  }
};
