import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Card, Avatar, Searchbar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannerRes, hostRes] = await Promise.all([
        api.get('/marketing/banners'),
        api.get('/hosts')
      ]);
      setBanners(bannerRes.data);
      setHosts(hostRes.data);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderBanner = ({ item }) => (
    <Card style={styles.bannerCard}>
      <Image 
        source={{ uri: `https://kairo-b1i9.onrender.com${item.imageUrl}` }} 
        style={styles.bannerImage} 
        resizeMode="cover"
      />
    </Card>
  );

  const renderHost = ({ item }) => (
    <TouchableOpacity 
      style={styles.hostCard}
      onPress={() => navigation.navigate('VideoCall', {
        userId: 'user_123', // This should be real current user ID
        userName: 'Current User',
        hostId: item._id,
        hostName: item.name,
        callId: 'call_' + Date.now(),
        callRatePerMinute: 30
      })}
    >
      <View style={styles.hostImageContainer}>
        <Avatar.Image size={100} source={{ uri: item.profilePicture || 'https://via.placeholder.com/100' }} />
        <View style={[styles.statusDot, { backgroundColor: item.status === 'Online' ? '#4CAF50' : '#F44336' }]} />
      </View>
      <Text style={styles.hostName}>{item.name}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>⭐ {item.rating || '4.5'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator animating={true} color="#8A2BE2" /></View>;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8A2BE2', '#4B0082']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Zora Premium</Text>
          <Searchbar
            placeholder="Search hosts..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={{ minHeight: 0 }}
          />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banners */}
        <FlatList
          data={banners.filter(b => b.isActive)}
          renderItem={renderBanner}
          keyExtractor={item => item._id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerList}
        />

        {/* Hosts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Hosts</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        <FlatList
          data={hosts.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()))}
          renderItem={renderHost}
          keyExtractor={item => item._id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.hostList}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  searchBar: {
    elevation: 4,
    borderRadius: 15,
    backgroundColor: '#FFF',
  },
  bannerList: {
    marginTop: 20,
  },
  bannerCard: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    color: '#8A2BE2',
    fontWeight: '600',
  },
  hostList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  hostCard: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 8,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hostImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  statusDot: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  hostName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    marginTop: 5,
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
});

export default HomeScreen;
