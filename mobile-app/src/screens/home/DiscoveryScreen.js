import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import api from '../../services/api';



const DiscoveryScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      fetchAllUsers();
    } else {
      const delayDebounceFn = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [query]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Fetch general list of users (showing active ones first)
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => {
        // Placeholder: Navigate to detail or start chat
        // navigation.navigate('Chat', { recipientId: item._id, recipientName: item.name });
      }}
    >
      <View style={[styles.avatarPlaceholder, { backgroundColor: item.gender === 'Female' ? '#FF69B4' : '#007BFF' }]}>
        <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#CCC' }]} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.name}
          {item.isVerified && <Text style={styles.blueTick}> ✓</Text>}
        </Text>
        <Text style={styles.userStatus}>{item.status === 'online' ? 'Active Now' : 'Offline'}</Text>
        {item.location ? <Text style={styles.userDetail}>📍 {item.location}</Text> : null}
      </View>
      <TouchableOpacity 
        style={styles.connectButton}
        onPress={() => {
           // Direct to video call or chat
        }}
      >
        <Text style={styles.connectText}>Connect</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discovery</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by nickname, location, or interests..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            query.trim() !== '' ? (
              <Text style={styles.emptyText}>No users found. Try a different term.</Text>
            ) : (
              <Text style={styles.emptyText}>Start typing to discover people.</Text>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInput: {
    backgroundColor: '#FFF',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  blueTick: {
    color: '#007BFF',
  },
  userDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  connectText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
    fontSize: 16,
  }
});

export default DiscoveryScreen;
