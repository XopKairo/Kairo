import React, { Suspense, lazy, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Home, Bell as BellIcon, User as UserIcon, MessageCircle } from 'lucide-react-native';
import { View, ActivityIndicator, Platform, Image, Text } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import mobileAds from 'react-native-google-mobile-ads';

// Components & Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ZoraAlert from './src/components/ZoraAlert';
import NetworkBanner from './src/components/NetworkBanner';
import IncomingCallModal from './src/components/IncomingCallModal';
import socketService from './src/services/socketService';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import UserRegisterScreen from './src/screens/auth/UserRegisterScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import UserProfileScreen from './src/screens/profile/UserProfileScreen';
import HostProfileScreen from './src/screens/profile/HostProfileScreen';
import VerificationScreen from './src/screens/profile/VerificationScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import VipScreen from './src/screens/profile/VipScreen';
import ScratchCardScreen from './src/screens/profile/ScratchCardScreen';
import SelectInterestsScreen from './src/screens/profile/SelectInterestsScreen';
import HostRegistrationScreen from './src/screens/profile/host/HostRegistrationScreen';
import HostOTPScreen from './src/screens/profile/host/HostOTPScreen';
import WalletScreen from './src/screens/wallet/WalletScreen';
import HistoryScreen from './src/screens/wallet/HistoryScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import GamesScreen from './src/screens/home/GamesScreen';
import MaintenanceScreen from './src/screens/system/MaintenanceScreen';

import ChatListScreen from './src/screens/chat/ChatListScreen';

const VideoCallScreen = lazy(() => import('./src/screens/call/VideoCallScreen'));

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HeaderLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image source={require('./assets/icon.png')} style={{ width: 28, height: 28, borderRadius: 6, marginRight: 10 }} />
    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>ZORA</Text>
  </View>
);

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
            <View style={{ alignItems: 'center', justifyContent: 'center', top: Platform.OS === 'ios' ? 10 : 0 }}>
              <View style={focused ? {
                backgroundColor: 'rgba(108, 43, 217, 0.15)', padding: 8, borderRadius: 15,
                shadowColor: '#6C2BD9', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5
              } : {}}>
                <IconComponent size={focused ? 26 : 24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            </View>
          );
        },
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { 
          backgroundColor: '#0F0A19', height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10, borderTopColor: 'rgba(159, 103, 255, 0.1)', borderTopWidth: 1, elevation: 0
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ChatMain" component={ChatListScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

function NavigationStack() {
  const { isMaintenance, checkMaintenance, alertConfig, hideAlert, user } = useAuth();
  const [incomingCall, setIncomingCall] = React.useState(null);
  const navigationRef = React.useRef(null);

  React.useEffect(() => {
    if (user) {
      const uid = user._id || user.id;
      socketService.connect(uid);
      
      socketService.setIncomingCallHandler((data) => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        // Avoid nested calls or showing modal if already in VideoCall
        if (currentRoute && currentRoute.name === 'VideoCall') {
          if (socketService.socket?.connected) {
            socketService.socket.emit('callEnded', data.callId);
          }
          return;
        }
        setIncomingCall(data);
      });

      socketService.setCallTimeoutHandler(() => {
        setIncomingCall(null);
      });

      socketService.setForceDisconnectHandler(() => {
        setIncomingCall(null);
      });

      return () => {
        socketService.setIncomingCallHandler(() => {});
        socketService.setCallTimeoutHandler(() => {});
        socketService.setForceDisconnectHandler(() => {});
      };
    }
  }, [user]);

  const handleAccept = () => {
    if (incomingCall) {
      const data = incomingCall;
      setIncomingCall(null);
      if (socketService.socket?.connected) {
        socketService.socket.emit('callAccepted', data.callId);
      }
      navigationRef.current?.navigate('VideoCall', {
        userId: user._id || user.id,
        userName: user.name,
        hostId: data.hostId || data.callerId || data.userId, // The person who started the call
        callId: data.callId,
        isIncoming: true,
        callRatePerMinute: data.callRatePerMinute || 30
      });
    }
  };

  const handleReject = () => {
    if (incomingCall && socketService.socket?.connected) {
      socketService.socket.emit('callEnded', incomingCall.callId);
    }
    setIncomingCall(null);
  };

  if (isMaintenance) {
    return <MaintenanceScreen onRefresh={checkMaintenance} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
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
              <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#6C2BD9" /></View>}>
                <VideoCallScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="VIP" component={VipScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ScratchCard" component={ScratchCardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Games" component={GamesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="SelectInterests" component={SelectInterestsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HostRegistration" component={HostRegistrationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HostOTP" component={HostOTPScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Global Incoming Call UI */}
      <IncomingCallModal 
        visible={!!incomingCall}
        callerName={incomingCall?.userName}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      {/* Global Supreme Alert */}
      <ZoraAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onClose={hideAlert}
      />
    </View>
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    async function initApp() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch (e) {
        console.log('Notification permission error:', e);
      }
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('inset-touch');
          await SystemUI.setBackgroundColorAsync('transparent');
        } catch (e) {}
      }

      try {
        await mobileAds().initialize();
      } catch (err) {}
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
