import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import ZoraButton from '../../components/ZoraButton';
import { CheckCircle2, ChevronLeft, Heart } from 'lucide-react-native';

const SelectInterestsScreen = ({ navigation }) => {
  const [interests, setInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const [allRes, userRes] = await Promise.all([
        api.get('/public/interests/active'),
        api.get('/user/auth/me')
      ]);
      setInterests(allRes.data || []);
      setSelected(userRes.data?.interests || []);
    } catch (error) {
      console.error('Fetch Interests Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('user/auth/profile-update', { interests: selected });
      Alert.alert('Success', 'Interests updated!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save interests');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color={COLORS.textWhite} size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>INTERESTS</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.intro}>
         <Heart color={COLORS.accentGlow} size={40} fill={COLORS.accentGlow} />
         <Text style={styles.title}>What do you like?</Text>
         <Text style={styles.subtitle}>Select topics to personalize your experience.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.chipContainer} showsVerticalScrollIndicator={false}>
          {interests.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={[styles.chip, selected.includes(item.name) && styles.activeChip]} 
              onPress={() => toggleInterest(item.name)}
            >
              <Text style={[styles.chipText, selected.includes(item.name) && { color: '#FFF' }]}>{item.name}</Text>
              {selected.includes(item.name) && <CheckCircle2 size={14} color="#FFF" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <ZoraButton title="Save Interests" onPress={handleSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  headerTitle: { color: COLORS.textWhite, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  intro: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  title: { color: COLORS.textWhite, fontSize: 24, fontWeight: '900', marginTop: 15 },
  subtitle: { color: COLORS.textGray, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.lg, justifyContent: 'center', gap: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.1)' },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textGray, fontWeight: 'bold', fontSize: 14 },
  footer: { padding: SPACING.xl }
});

export default SelectInterestsScreen;
