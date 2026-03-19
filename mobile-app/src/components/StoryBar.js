import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import api from '../services/api';
import { COLORS, SPACING } from '../theme/theme';

const StoryBar = ({ navigation, currentUser }) => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await api.get('user/stories/feed');
      setStories(res.data);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storyContainer}
      onPress={() => navigation.navigate('StoryView', { userStories: item })}
    >
      <LinearGradient
        colors={['#CA426E', '#E28251']}
        style={styles.gradientBorder}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.user.profilePicture || `https://ui-avatars.com/api/?name=${item.user.name}` }}
            style={styles.profileImage}
          />
        </View>
      </LinearGradient>
      <Text style={styles.username} numberOfLines={1}>
        {item.user.nickname || item.user.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderItem}
        keyExtractor={(item) => item.user._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={
          <TouchableOpacity style={styles.storyContainer} onPress={() => navigation.navigate('StoryUpload')}>
            <View style={styles.myStoryContainer}>
              <Image
                source={{ uri: currentUser?.profilePicture || `https://ui-avatars.com/api/?name=${currentUser?.name}` }}
                style={styles.myProfileImage}
              />
              <View style={styles.plusIcon}>
                <Plus color="#FFF" size={12} strokeWidth={3} />
              </View>
            </View>
            <Text style={styles.username}>Your Story</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 68,
  },
  gradientBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundDark,
    padding: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  myStoryContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
    marginBottom: 4,
  },
  myProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  plusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundDark,
  },
  username: {
    color: COLORS.textWhite,
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StoryBar;