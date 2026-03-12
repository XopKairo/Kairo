import React from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { ShieldCheck, MapPin, Globe2, Video, MessageCircle, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const SwipeCard = ({ item, onCall, onChat }) => {
  const languagesStr = item.languages && item.languages.length > 0 ? item.languages.join(', ') : 'English';
  
  return (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.profilePicture || 'https://ui-avatars.com/api/?name=Host&background=random&size=400' }} 
        style={styles.image}
        resizeMode="cover"
      />
      
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']} 
        style={styles.gradient}
      >
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}, {item.age || 21}</Text>
            {item.isVerified && (
              <ShieldCheck color="#10B981" size={24} fill="#10B981" style={styles.badge} />
            )}
          </View>

          <View style={styles.detailRow}>
            <MapPin color="#FFF" size={16} />
            <Text style={styles.detailText}>{item.location || 'Nearby'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Globe2 color="#FFF" size={16} />
            <Text style={styles.detailText}>{languagesStr}</Text>
          </View>

          <Text style={styles.bio} numberOfLines={2}>{item.bio || 'Elite Zora Member'}</Text>

          {/* Action Buttons inside Card */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onChat}>
              <MessageCircle color="#FFF" size={28} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.callBtn} onPress={onCall}>
              <Video color="#FFF" size={32} fill="#FFF" />
              <Text style={styles.callText}>Video Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Heart color="#F43F5E" size={28} fill="#F43F5E" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Status Dot */}
      <View style={[styles.statusDot, { backgroundColor: item.status === 'Online' ? COLORS.success : '#999' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    height: height * 0.7,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  infoContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  badge: {
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    opacity: 0.9,
  },
  detailText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  bio: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 27,
    marginHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  callText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  statusDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#000',
  }
});

export default SwipeCard;
