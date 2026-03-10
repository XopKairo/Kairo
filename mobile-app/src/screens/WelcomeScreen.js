import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Image,
  SafeAreaView,
  Platform
} from 'react-native';
import { COLORS, SPACING } from '../theme/theme';
import ZoraButton from '../components/ZoraButton';

const { width } = Dimensions.get('window');

const dummyProfiles = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/46.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
  'https://randomuser.me/api/portraits/men/22.jpg',
];

const WelcomeScreen = ({ navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [activeUsers, setActiveUsers] = useState(14502);

  useEffect(() => {
    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Infinite Marquee Animation
    const marqueeAnim = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -width, // Move left by screen width
        duration: 8000,
        useNativeDriver: true,
      })
    );
    marqueeAnim.start();

    // Increment active users for effect
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);

    return () => {
      marqueeAnim.stop();
      clearInterval(interval);
    };
  }, []);

  const handleContinue = () => {
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.quote}>
          "A new world of elite connections awaits you."
        </Text>
        <Text style={styles.subtitle}>Welcome to Zora</Text>

        <View style={styles.marqueeContainer}>
          <Animated.View style={[styles.marqueeTrack, { transform: [{ translateX: scrollX }] }]}>
            {/* Double the profiles to create seamless loop */}
            {[...dummyProfiles, ...dummyProfiles].map((uri, index) => (
              <View key={index} style={styles.profileWrapper}>
                <Image source={{ uri }} style={styles.profilePic} />
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.activeDot} />
          <Text style={styles.statsText}>
            {activeUsers.toLocaleString()} Users active right now
          </Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <ZoraButton
          title="Continue to App"
          onPress={handleContinue}
          style={styles.continueBtn}
          loading={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  quote: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.textWhite,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 34,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 60,
  },
  marqueeContainer: {
    height: 100,
    width: width * 2, // Wider to allow overflow
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 40,
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 2, // Enough width for all profiles
  },
  profileWrapper: {
    marginHorizontal: 10,
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.accentGlow,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 43, 217, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.2)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Emerald green
    marginRight: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 2,
  },
  statsText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  continueBtn: {
    width: '100%',
  }
});

export default WelcomeScreen;
