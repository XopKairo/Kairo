<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Global App Settings' });
const settings = ref<any>({ callRate: 0, commission: 0, maintenance: false });

const fetchSettings = async () => {
  try {
    const res = await axios.get('https://kairo-novh.onrender.com/api/admin/settings/app');
    if (res.data) {
      settings.value = res.data;
    }
  } catch (error) {
    console.error("Error fetching app settings:", error);
  }
};

const saveSettings = async () => {
  try {
    await axios.post('https://kairo-novh.onrender.com/api/admin/settings/app', settings.value);
    alert("App Settings Saved!");
  } catch (error) {
    console.error("Error saving app settings:", error);
    alert("Failed to save settings.");
  }
};

onMounted(fetchSettings);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <UiParentCard title="Revenue Control">
        <v-text-field v-model="settings.callRate" label="Call Rate (Coins/Min)" type="number" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="settings.commission" label="Host Commission (%)" type="number" variant="outlined" class="mb-4"></v-text-field>
        <v-btn color="primary" block @click="saveSettings">Save Changes</v-btn>
      </UiParentCard>
    </v-col>
    <v-col cols="12" md="6">
      <UiParentCard title="System Control">
        <v-switch v-model="settings.maintenance" label="Maintenance Mode" color="error"></v-switch>
        <v-btn color="secondary" block @click="saveSettings">Update System</v-btn>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
