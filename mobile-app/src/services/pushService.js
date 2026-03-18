import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

export const registerForPushNotificationsAsync = async (userId) => {
  if (!Device.isDevice) {
    console.log('Push Notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the token with project ID for newer Expo versions
    const tokenData = await Notifications.getExpoPushTokenAsync({
       // projectId: 'your-project-id' // Ideally should be here
    });
    const token = tokenData.data;
    
    // Send token to backend
    if (userId && token) {
      try {
        await api.put('user/users/push-token', { pushToken: token });
        console.log('✅ Push token synced successfully');
      } catch (error) {
        console.error('❌ Failed to sync push token:', error.message || error);
      }
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
};