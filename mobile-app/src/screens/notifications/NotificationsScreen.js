import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, Divider } from 'react-native-paper';
import socketService from '../../services/socketService';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Welcome', description: 'Welcome to Zora!', icon: 'information', color: 'blue' }
  ]);

  useEffect(() => {
    // Assuming 'user_123' is the logged-in user's ID
    socketService.connect('user_123');
    
    if (socketService.socket) {
      socketService.socket.on('walletUpdate', (data) => {
        const newNotif = {
          id: Date.now().toString(),
          title: data.message,
          description: `Your new balance is ${data.newBalance} coins.`,
          icon: 'coin',
          color: 'green'
        };
        setNotifications(prev => [newNotif, ...prev]);
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('walletUpdate');
      }
    };
  }, []);

  const renderItem = ({ item }) => (
    <List.Item
      title={item.title}
      description={item.description}
      left={props => <List.Icon {...props} icon={item.icon} color={item.color} />}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default NotificationsScreen;
