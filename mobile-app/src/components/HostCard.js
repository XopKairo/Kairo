import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

const HostCard = React.memo(({ item, currentUser, navigation, appSettings }) => {
  return (
    <TouchableOpacity 
      style={styles.hostCard}
      activeOpacity={0.9}
      onPress={() => {
        if (!currentUser) return;
        navigation.navigate('VideoCall', {
          userId: currentUser.id || currentUser._id,
          userName: currentUser.name || 'User',
          hostId: item._id,
          hostName: item.name,
          callId: 'call_' + Date.now(),
          callRatePerMinute: appSettings.callRate || 30
        });
      }}
    >
      <View style={styles.hostImageContainer}>
        <Avatar.Image size={120} source={{ uri: item.profilePicture || 'https://via.placeholder.com/120' }} />
        <View style={[styles.statusDot, { backgroundColor: item.status === 'Online' ? COLORS.success : COLORS.error }]} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.hostOverlay}>
           <View style={styles.ratingBadge}>
              <Star size={10} fill="#FFD700" color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating || '4.8'}</Text>
           </View>
        </LinearGradient>
      </View>
      <View style={styles.hostInfo}>
        <Text style={styles.hostName}>{item.name}</Text>
        <Text style={styles.hostPrice}>{appSettings.callRate || 30} coins/min</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  hostCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    margin: 8,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(159, 103, 255, 0.1)',
  },
  hostImageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  hostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    padding: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hostInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  hostName: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  hostPrice: {
    color: COLORS.accentGlow,
    fontSize: 12,
    marginTop: 2,
  }
});

export default HostCard;
