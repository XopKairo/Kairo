import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Play } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme/theme';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 3;

const MomentGallery = ({ moments, onMomentPress }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onMomentPress(item)}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.mediaUrl }}
        style={styles.image}
      />
      {item.mediaType === 'video' && (
        <View style={styles.playIcon}>
          <Play color="#FFF" size={16} fill="#FFF" />
        </View>
      )}
      {item.title ? (
        <View style={styles.titleOverlay}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={moments}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No moments shared yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.3,
    margin: 5,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 4,
    borderRadius: 10,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
  },
  title: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
});

export default MomentGallery;