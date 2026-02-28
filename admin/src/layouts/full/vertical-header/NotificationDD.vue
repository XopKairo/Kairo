<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MailboxIcon, BellIcon, InfoCircleIcon } from 'vue-tabler-icons';
import axios from 'axios';
import { io } from 'socket.io-client';

const notifications = ref<any[]>([]);
const socket = io('https://kairo-b1i9.onrender.com');

const fetchNotifications = async () => {
  try {
    const res = await axios.get('https://kairo-b1i9.onrender.com/api/admin/notifications');
    notifications.value = res.data;
  } catch (error) {
    console.error("Error fetching notifications");
  }
};

const dismissNotification = async (id: number) => {
  try {
    await axios.put(`https://kairo-b1i9.onrender.com/api/admin/notifications/${id}/dismiss`);
    notifications.value = notifications.value.filter(n => n.id !== id);
  } catch (error) {
    console.error("Error dismissing notification");
  }
};

const markAllRead = async () => {
  // Logic to mark all as read can be added here
  notifications.value = [];
};

onMounted(() => {
  fetchNotifications();
  socket.on('new-notification', (notif) => {
    notifications.value.unshift(notif);
    // Simple audio or visual alert can be added here
  });
});

onUnmounted(() => {
  socket.disconnect();
});
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-3">
      <h6 class="text-subtitle-1">
        Live Notifications
        <v-chip v-if="notifications.length" color="error" variant="flat" size="small" class="ml-2 text-white">
          {{ notifications.filter(n => !n.read).length }}
        </v-chip>
      </h6>
      <a href="javascript:void(0)" @click="markAllRead" class="text-decoration-underline text-primary text-subtitle-2">Clear All</a>
    </div>
  </div>
  <v-divider></v-divider>
  <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 650px">
    <v-list class="py-0" lines="three">
      <template v-if="notifications.length">
        <template v-for="notif in notifications" :key="notif.id">
          <v-list-item :value="notif.id" color="secondary" class="no-spacer">
            <template v-slot:prepend>
              <v-avatar size="40" variant="flat" color="lightprimary" class="mr-3 text-primary">
                <BellIcon size="20" />
              </v-avatar>
            </template>
            <div class="d-inline-flex align-center justify-space-between w-100">
              <h6 class="text-subtitle-1 font-weight-bold">{{ notif.title }}</h6>
              <span class="text-caption text-medium-emphasis">{{ new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
            </div>
            <p class="text-subtitle-2 text-medium-emphasis mt-1">{{ notif.message }}</p>
            <div class="mt-2">
              <v-btn size="x-small" color="primary" variant="text" @click="dismissNotification(notif.id)">Dismiss</v-btn>
            </div>
          </v-list-item>
          <v-divider></v-divider>
        </template>
      </template>
      <div v-else class="pa-10 text-center text-medium-emphasis">
        <InfoCircleIcon size="32" class="mb-2" />
        <p>No new notifications</p>
      </div>
    </v-list>
  </perfect-scrollbar>
</template>
