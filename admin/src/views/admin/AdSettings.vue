<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Ads & Reward Settings' });
const adConfig = ref({
  enableAds: true,
  rewardPerAd: 5,
  dailyLimit: 10,
  adMobId: '',
  interstitialId: ''
});

const fetchSettings = async () => {
  const response = await axios.get('https://kairo-b1i9.onrender.com/api/settings/ads');
  if (response.data.rewardPerAd) adConfig.value = response.data;
};

const saveSettings = async () => {
  await axios.post('https://kairo-b1i9.onrender.com/api/settings/ads', adConfig.value);
  alert("Ad Settings Saved to Database!");
};

onMounted(fetchSettings);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <UiParentCard title="Ad Reward System">
        <v-switch v-model="adConfig.enableAds" label="Enable Rewarded Ads" color="success"></v-switch>
        <v-text-field v-model="adConfig.rewardPerAd" label="Coins per Ad" type="number" variant="outlined"></v-text-field>
        <v-text-field v-model="adConfig.dailyLimit" label="Daily Limit" type="number" variant="outlined"></v-text-field>
        <v-btn color="primary" block @click="saveSettings">Save Reward Rules</v-btn>
      </UiParentCard>
    </v-col>
    <v-col cols="12" md="6">
      <UiParentCard title="AdMob Config">
        <v-text-field v-model="adConfig.adMobId" label="AdMob App ID" variant="outlined"></v-text-field>
        <v-btn color="secondary" block @click="saveSettings">Save Network Config</v-btn>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
