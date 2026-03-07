import { v2 as cloudinary } from 'cloudinary';
import multerStorageCloudinary from 'multer-storage-cloudinary';

// Handle different import versions safely
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getStorage = (folderName, type = 'image') => {
  const params = {
    folder: `kairo/${folderName}`,
  };

  if (type === 'video') {
    params.resource_type = 'video';
    params.allowed_formats = ['mp4', 'mov', 'avi'];
  } else {
    params.allowed_formats = ['jpg', 'png', 'jpeg', 'webp'];
    params.transformation = [{ width: 1080, height: 1080, crop: 'limit' }];
  }

  try {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: params
    });
  } catch (err) {
    console.error('Failed to instantiate CloudinaryStorage:', err.message);
    throw err;
  }
};

export { cloudinary, getStorage };
