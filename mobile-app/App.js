import React, { Suspense, lazy, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import UserRegisterScreen from './src/screens/auth/UserRegisterScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import FeedScreen from './src/screens/home/FeedScreen';
import DiscoveryScreen from './src/screens/home/DiscoveryScreen';
import UserProfileScreen from './src/screens/profile/UserProfileScreen';
import VerificationScreen from './src/screens/profile/VerificationScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import SelectInterestsScreen from './src/screens/profile/SelectInterestsScreen';
import WalletScreen from './src/screens/wallet/WalletScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import MaintenanceScreen from './src/screens/system/MaintenanceScreen';
import NetworkBanner from './src/components/NetworkBanner';
import { useAuth } from './src/context/AuthContext';

// Lazy load heavy screens
const VideoCallScreen = lazy(() => import('./src/screens/call/VideoCallScreen'));

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function NavigationStack() {
  const { isMaintenance, checkMaintenance } = useAuth();

  if (isMaintenance) {
    return <MaintenanceScreen onRefresh={checkMaintenance} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={UserRegisterScreen} options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="VideoCall" options={{ headerShown: false }}>
          {(props) => (
            <Suspense fallback={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#6C2BD9" />
              </View>
            }>
              <VideoCallScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerStyle: { backgroundColor: '#0F0A19' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Complete Profile' }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My Wallet & Withdraw' }} />
        <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Get Verified' }} />
        <Stack.Screen name="SelectInterests" component={SelectInterestsScreen} options={{ title: 'Interests' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    async function lockImmersiveMode() {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('inset-touch');
          await SystemUI.setBackgroundColorAsync('transparent');
        } catch (e) {}
      }
    }
    lockImmersiveMode();
  }, []);

  return (
    <AuthProvider>
      <PaperProvider>
        <NetworkBanner />
        <NavigationStack />
      </PaperProvider>
    </AuthProvider>
  );
}
