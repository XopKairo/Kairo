import React, { useState } from 'react';
import { View, StyleSheet, Text, Switch, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert } from 'react-native';
import { Bell, Shield, LogOut, ChevronRight, Moon, UserCircle, MessageSquare } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const [notifs, setNotifs] = useState(true);
  const [isDark, setIsDark] = useState(true);

  const SettingItem = ({ icon: Icon, title, right = null, onPress = () => {}, color = COLORS.textWhite }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
      <View style={styles.left}>
        <View style={styles.iconBox}><Icon color={color} size={20} /></View>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      {right ? right : <ChevronRight color={COLORS.textGray} size={18} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <SettingItem 
          icon={Bell} 
          title="Push Notifications" 
          right={<Switch value={notifs} onValueChange={setNotifs} trackColor={{ false: '#333', true: COLORS.primary }} />} 
        />
        <SettingItem 
          icon={Moon} 
          title="Dark Mode" 
          right={<Switch value={isDark} onValueChange={setIsDark} trackColor={{ false: '#333', true: COLORS.primary }} />} 
        />

        <Text style={[styles.sectionLabel, { marginTop: 30 }]}>SECURITY & SUPPORT</Text>
        <SettingItem icon={Shield} title="Privacy Policy" onPress={() => {}} />
        <SettingItem icon={MessageSquare} title="Support Chat" onPress={() => {}} />
        <SettingItem icon={UserCircle} title="Account Deletion" onPress={() => {
           Alert.alert('Delete Account', 'This action is permanent. Are you sure?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }]);
        }} color={COLORS.error} />

        <TouchableOpacity 
          style={[styles.item, { marginTop: 40, borderColor: 'rgba(255,75,75,0.2)' }]} 
          onPress={async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          }}
        >
          <View style={styles.left}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,75,75,0.05)' }]}><LogOut color={COLORS.error} size={20} /></View>
            <Text style={[styles.itemTitle, { color: COLORS.error }]}>Log Out</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with love by Ajil M</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { padding: SPACING.lg },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textWhite, letterSpacing: 2 },
  content: { padding: SPACING.lg },
  sectionLabel: { color: COLORS.textGray, fontSize: 12, fontWeight: '900', marginBottom: 15, marginLeft: 10, letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBackground, padding: 16, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(159, 103, 255, 0.05)' },
  left: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemTitle: { color: COLORS.textWhite, fontSize: 15, fontWeight: '600' },
  footer: { marginTop: 50, marginBottom: 30, alignItems: 'center', opacity: 0.5 },
  footerText: { color: COLORS.textWhite, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  versionText: { color: COLORS.textGray, fontSize: 10, marginTop: 5 }
});

export default SettingsScreen;
