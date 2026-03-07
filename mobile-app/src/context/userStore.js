import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create((set) => ({
  currentUser: null,
  loading: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  loadUser: async () => {
    set({ loading: true });
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) set({ currentUser: JSON.parse(userDataStr) });
    } catch (error) {
      console.error('Load User Error:', error);
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userToken');
    set({ currentUser: null });
  }
}));

export default useUserStore;
