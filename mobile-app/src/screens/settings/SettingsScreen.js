import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';

const SettingsScreen = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>General</List.Subheader>
        <List.Item
          title="Push Notifications"
          left={() => <List.Icon icon="bell" />}
          right={() => (
            <Switch
              value={isNotificationsEnabled}
              onValueChange={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Dark Mode"
          left={() => <List.Icon icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isDarkMode}
              onValueChange={() => setIsDarkMode(!isDarkMode)}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Privacy Policy"
          left={() => <List.Icon icon="shield-account" />}
          onPress={() => {}}
        />
        <List.Item
          title="Logout"
          left={() => <List.Icon icon="logout" color="red" />}
          onPress={() => console.log('Logout')}
          titleStyle={{ color: 'red' }}
        />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default SettingsScreen;
