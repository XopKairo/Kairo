import React, { Suspense, lazy, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Home, Search as SearchIcon, PlaySquare, Bell as BellIcon, User as UserIcon } from 'lucide-react-native';
import { View, ActivityIndicator, Platform, Image, Text } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import mobileAds from 'react-native-google-mobile-ads';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import UserRegisterScreen from './src/screens/auth/UserRegisterScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import FeedScreen from './src/screens/home/FeedScreen';
import DiscoveryScreen from './src/screens/home/DiscoveryScreen';
import UserProfileScreen from './src/screens/profile/UserProfileScreen';
import HostProfileScreen from './src/screens/profile/HostProfileScreen';
import VerificationScreen from './src/screens/profile/VerificationScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import VipScreen from './src/screens/profile/VipScreen';
import ScratchCardScreen from './src/screens/profile/ScratchCardScreen';
import SelectInterestsScreen from './src/screens/profile/SelectInterestsScreen';
import WalletScreen from './src/screens/wallet/WalletScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import GamesScreen from './src/screens/home/GamesScreen';
import MaintenanceScreen from './src/screens/system/MaintenanceScreen';
import NetworkBanner from './src/components/NetworkBanner';
import { useAuth } from './src/context/AuthContext';

// Lazy load heavy screens
const VideoCallScreen = lazy(() => import('./src/screens/call/VideoCallScreen'));

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HeaderLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image 
      source={require('./assets/icon.png')} 
      style={{ width: 28, height: 28, borderRadius: 6, marginRight: 10 }} 
    />
    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>ZORA</Text>
  </View>
);

import { MessageCircle } from 'lucide-react-native';

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'Home') IconComponent = Home;
          else if (route.name === 'ChatMain') IconComponent = MessageCircle;
          else if (route.name === 'Notifications') IconComponent = BellIcon;
          else if (route.name === 'Profile') IconComponent = UserIcon;
          
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              top: Platform.OS === 'ios' ? 10 : 0
            }}>
              <View style={focused ? {
                backgroundColor: 'rgba(108, 43, 217, 0.15)',
                padding: 8,
                borderRadius: 15,
                shadowColor: '#6C2BD9',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 5
              } : {}}>
                <IconComponent size={focused ? 26 : 24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            </View>
          );
        },
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { 
          backgroundColor: '#0F0A19', 
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          borderTopColor: 'rgba(159, 103, 255, 0.1)',
          borderTopWidth: 1,
          elevation: 0
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="ChatMain" component={ChatScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

function NavigationStack() {
  const { isMaintenance, checkMaintenance } = useAuth();

  if (isMaintenance) {
    return <MaintenanceScreen onRefresh={checkMaintenance} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: { backgroundColor: '#0F0A19' },
          headerTintColor: '#fff',
          headerTitle: () => <HeaderLogo />,
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OTP" component={OTPScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="Register" component={UserRegisterScreen} options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="HostProfile" component={HostProfileScreen} options={{ headerShown: false }} />
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
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="VIP" component={VipScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScratchCard" component={ScratchCardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Games" component={GamesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="SelectInterests" component={SelectInterestsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    async function initApp() {
      // Request Permissions on Startup
      try {
        await Camera.requestCameraPermissionsAsync();
        await Audio.requestPermissionsAsync();
        await Location.requestForegroundPermissionsAsync();
      } catch (pe) {
        console.warn('Permission request failed', pe);
      }

      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('inset-touch');
          await SystemUI.setBackgroundColorAsync('transparent');
        } catch (e) {
          console.warn('Android UI initialisation failed:', e);
        }
      }

      try {
        await mobileAds().initialize();
      } catch (err) {
        console.warn('MobileAds initialisation failed', err);
      }
    }
    initApp();
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
