import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';



const SelectInterestsScreen = ({ navigation }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTagsAndUserInterests();
  }, []);

  const fetchTagsAndUserInterests = async () => {
    try {
      // Fetch global active tags
      const tagsRes = await api.get(`/interests/active`);
      setAvailableTags(tagsRes.data || []);

      // Fetch user's current interests
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
            // Getting user details might require a GET endpoint, 
            // for now, let's assume we just load from AsyncStorage if stored,
            // or just start empty if not. (In a real app, fetch full user profile)
            if (user.interests) {
                setSelectedInterests(user.interests);
            }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback tags if API fails
      if(availableTags.length === 0) {
          setAvailableTags([
              { _id: '1', name: 'Music', icon: '🎵' },
              { _id: '2', name: 'Gaming', icon: '🎮' },
              { _id: '3', name: 'Travel', icon: '✈️' },
              { _id: '4', name: 'Fitness', icon: '💪' },
              { _id: '5', name: 'Movies', icon: '🎬' },
              { _id: '6', name: 'Photography', icon: '📸' }
          ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (tagName) => {
    if (selectedInterests.includes(tagName)) {
      setSelectedInterests(selectedInterests.filter(i => i !== tagName));
    } else {
      if (selectedInterests.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 interests.');
        return;
      }
      setSelectedInterests([...selectedInterests, tagName]);
    }
  };

  const saveInterests = async () => {
    setSaving(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('userToken');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user.id) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      await api.put(`/users/${user.id}/interests`, {
        interests: selectedInterests
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local storage
      user.interests = selectedInterests;
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Alert.alert('Success', 'Interests updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save interests.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What are you into?</Text>
      <Text style={styles.subtitle}>Select up to 5 interests to help us find the best matches for you.</Text>

      <ScrollView contentContainerStyle={styles.chipsContainer}>
        {availableTags.map((tag) => {
          const isSelected = selectedInterests.includes(tag.name);
          return (
            <TouchableOpacity
              key={tag._id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleInterest(tag.name)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {tag.icon} {tag.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={saveInterests}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveText}>Save Interests</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  chip: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  chipText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#8A2BE2',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#B57EDC',
  },
  saveText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default SelectInterestsScreen;
