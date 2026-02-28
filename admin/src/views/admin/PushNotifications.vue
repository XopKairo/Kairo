<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Push Notifications' });
const notifications = ref<any[]>([]);
const form = ref({ title: '', message: '' });

const fetchHistory = async () => {
  const res = await axios.get('https://kairo-b1i9.onrender.com/api/notifications');
  notifications.value = res.data;
};

const sendNotify = async () => {
  if(!form.value.title) return;
  try {
    const res = await axios.post('https://kairo-b1i9.onrender.com/api/notifications', { ...form.value, targetAudience: 'All', type: 'Info' });
    alert(`Notification Sent! Targeted ${res.data.tokenCount || 0} mobile users.`);
    form.value = { title: '', message: '' };
    fetchHistory();
  } catch (error) {
    alert("Failed to send notification.");
  }
};

onMounted(fetchHistory);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <UiParentCard title="New Notification">
        <v-text-field v-model="form.title" label="Title" variant="outlined"></v-text-field>
        <v-textarea v-model="form.message" label="Message Content" variant="outlined"></v-textarea>
        <v-btn color="primary" block size="large" @click="sendNotify">Send to All Users</v-btn>
      </UiParentCard>
    </v-col>
    <v-col cols="12" md="6">
      <UiParentCard title="History">
        <v-list lines="two">
          <v-list-item v-for="n in notifications" :key="n._id" :title="n.title" :subtitle="n.message">
            <template v-slot:append><span class="text-caption">{{ new Date(n.sentAt).toLocaleDateString() }}</span></template>
          </v-list-item>
        </v-list>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
