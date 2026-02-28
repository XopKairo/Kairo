<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { LogoutIcon, SettingsIcon, UserIcon, SearchIcon } from 'vue-tabler-icons';
import axios from 'axios';

const authStore = useAuthStore();
const profile = ref<any>({ name: 'Admin', role: 'Project Admin', dndMode: false, allowNotifications: true });
const search = ref('');

const fetchProfile = async () => {
  try {
    const res = await axios.get('https://kairo-b1i9.onrender.com/api/admin/profile');
    profile.value = res.data;
  } catch (e) { console.error("Error loading profile"); }
};

const updateSettings = async () => {
  try {
    await axios.post('https://kairo-b1i9.onrender.com/api/admin/profile/settings', {
      dndMode: profile.value.dndMode,
      allowNotifications: profile.value.allowNotifications
    });
  } catch (e) { console.error("Error saving settings"); }
};

const logout = () => {
  authStore.logout();
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

onMounted(fetchProfile);
</script>

<template>
  <div class="pa-4">
    <h4 class="mb-n1">{{ getTimeGreeting() }}, <span class="font-weight-regular">{{ profile.name }}</span></h4>
    <span class="text-subtitle-2 text-medium-emphasis">{{ profile.role }}</span>

    <v-text-field v-model="search" persistent-placeholder placeholder="Search settings..." class="my-3" color="primary" variant="outlined" hide-details>
      <template v-slot:prepend-inner>
        <SearchIcon stroke-width="1.5" size="20" class="text-lightText SearchIcon" />
      </template>
    </v-text-field>

    <v-divider></v-divider>
    <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 515px">
      <div class="bg-lightprimary rounded-md px-5 py-3 my-3">
        <div class="d-flex align-center justify-space-between">
          <h5 class="text-subtitle-1 font-weight-medium">Start DND Mode</h5>
          <v-switch v-model="profile.dndMode" color="primary" hide-details @change="updateSettings"></v-switch>
        </div>
        <div class="d-flex align-center justify-space-between">
          <h5 class="text-subtitle-1 font-weight-medium">Allow Notifications</h5>
          <v-switch v-model="profile.allowNotifications" color="primary" hide-details @change="updateSettings"></v-switch>
        </div>
      </div>

      <v-divider></v-divider>

      <v-list class="mt-3" density="compact">
        <v-list-item color="secondary" rounded="md" link to="/admin/settings">
          <template v-slot:prepend>
            <SettingsIcon size="20" class="mr-2" />
          </template>
          <v-list-item-title class="text-subtitle-2"> Account Settings</v-list-item-title>
        </v-list-item>

        <v-list-item color="secondary" rounded="md" link to="/admin/social-profile">
          <template v-slot:prepend>
            <UserIcon size="20" class="mr-2" />
          </template>
          <v-list-item-title class="text-subtitle-2"> Social Profile</v-list-item-title>
          <template v-slot:append>
            <v-chip color="warning" class="text-white" text="02" variant="flat" size="x-small" />
          </template>
        </v-list-item>

        <v-list-item @click="logout" color="secondary" rounded="md">
          <template v-slot:prepend>
            <LogoutIcon size="20" class="mr-2" />
          </template>
          <v-list-item-title class="text-subtitle-2"> Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </perfect-scrollbar>
  </div>
</template>
