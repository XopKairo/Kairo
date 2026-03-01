import React, { Suspense, lazy } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, ActivityIndicator } from 'react-native';

import ZoraSplashScreen from './src/screens/auth/ZoraSplashScreen';
import UserLoginScreen from './src/screens/auth/UserLoginScreen';
import UserRegisterScreen from './src/screens/auth/UserRegisterScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import FeedScreen from './src/screens/home/FeedScreen';
import DiscoveryScreen from './src/screens/home/DiscoveryScreen';
import UserProfileScreen from './src/screens/profile/UserProfileScreen';
import VerificationScreen from './src/screens/profile/VerificationScreen';
import SelectInterestsScreen from './src/screens/profile/SelectInterestsScreen';
import ChatScreen from './src/screens/call/ChatScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

// Lazy load the heavy VideoCallScreen
const VideoCallScreen = lazy(() => import('./src/screens/call/VideoCallScreen'));

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Feed') iconName = 'post';
          else if (route.name === 'Discovery') iconName = 'compass';
          else if (route.name === 'Notifications') iconName = 'bell';
          else if (route.name === 'Profile') iconName = 'account';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8A2BE2',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Discovery" component={DiscoveryScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={ZoraSplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={UserLoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={UserRegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="VideoCall" options={{ headerShown: false }}>
            {(props) => (
              <Suspense fallback={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              }>
                <VideoCallScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Get Verified' }} />
          <Stack.Screen name="SelectInterests" component={SelectInterestsScreen} options={{ title: 'Interests' }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
