import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { ShieldCheck, MapPin, Globe2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

const HostCard = React.memo(({ item, currentUser, navigation }) => {
  const languagesStr = item.languages && item.languages.length > 0 ? item.languages.join(', ') : 'English';
  const locationStr = item.location || 'Unknown Location';
  
  return (
    <TouchableOpacity 
      style={styles.hostCard}
      activeOpacity={0.9}
      onPress={() => {
        if (!currentUser) return;
        navigation.navigate('HostProfile', { hostId: item._id });
      }}
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: item.profilePicture || 'https://ui-avatars.com/api/?name=Host&background=random' }} 
          style={styles.hostImage}
          resizeMode="cover"
        />
        <View style={[styles.statusDot, { backgroundColor: item.status === 'Online' ? COLORS.success : COLORS.error }]} />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} 
          style={styles.hostOverlay}
        >
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.hostName} numberOfLines={1}>
                {item.name} {item.age ? `, ${item.age}` : ''}
              </Text>
              {item.isVerified && (
                <ShieldCheck color="#10B981" size={16} fill="#10B981" style={styles.verifiedBadge} />
              )}
            </View>
            
            <View style={styles.detailRow}>
              <Globe2 color={COLORS.textGray} size={12} />
              <Text style={styles.detailText} numberOfLines={1}>{languagesStr}</Text>
            </View>

            <View style={styles.detailRow}>
              <MapPin color={COLORS.textGray} size={12} />
              <Text style={styles.detailText} numberOfLines={1}>{locationStr}</Text>
            </View>
            
            {item.bio ? (
               <Text style={styles.bioText} numberOfLines={2}>{item.bio}</Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  hostCard: {
    flex: 1,
    margin: 6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 0.75, // Makes it a nice portrait rectangle
    position: 'relative',
  },
  hostImage: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    zIndex: 10,
  },
  hostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%', // Gradient covers bottom half
    justifyContent: 'flex-end',
    padding: 12,
  },
  infoContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hostName: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1, // prevents text from pushing badge out
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    opacity: 0.8,
  },
  detailText: {
    color: COLORS.textWhite,
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  bioText: {
    color: COLORS.textGray,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 14,
    fontStyle: 'italic',
  }
});

export default HostCard;
