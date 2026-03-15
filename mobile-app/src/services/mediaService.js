import api from './api';

export const uploadMedia = async (base64, type = 'image') => {
  try {
    const response = await api.post('user/users/upload-media', {
      file: base64,
      type // 'image' or 'video'
    });
    return response.data.url;
  } catch (error) {
    console.error('Media upload failed:', error);
    throw error;
  }
};
