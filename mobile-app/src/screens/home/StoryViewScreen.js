import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../theme/theme';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const StoryViewScreen = ({ route, navigation }) => {
  const { userStories } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const stories = userStories.stories;
  const user = userStories.user;

  useEffect(() => {
    // Mark as viewed
    const storyId = stories[currentIndex]._id;
    api.post(`user/stories/view/${storyId}`).catch(console.error);

    // Auto progress
    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentStory = stories[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: index < currentIndex ? '100%' : index === currentIndex ? '50%' : '0%' },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}` }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{user.nickname || user.name}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: currentStory.mediaUrl }}
          style={styles.media}
          resizeMode="contain"
        />
        {currentStory.caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{currentStory.caption}</Text>
          </View>
        ) : null}
      </View>

      {/* Navigation Areas */}
      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navSide} onPress={handlePrev} />
        <TouchableOpacity style={styles.navSide} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginTop: 10,
    zIndex: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  username: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: 5,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  media: {
    width: width,
    height: height,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  caption: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  navContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  navSide: {
    flex: 1,
  },
});

export default StoryViewScreen;