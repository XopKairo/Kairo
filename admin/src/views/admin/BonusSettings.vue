<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Bonus Settings' });
const bonusSettings = ref<any>({ newUser: 0, referral: 0, firstRecharge: 0, festiveBonus: false });

const fetchBonusSettings = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/admin/settings/bonus');
  if (res.data) {
    bonusSettings.value = res.data;
  }
};

const saveBonusSettings = async () => {
  await axios.post('https://kairo-novh.onrender.com/api/admin/settings/bonus', bonusSettings.value);
  alert("Bonus Settings Saved!");
};

onMounted(fetchBonusSettings);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <UiParentCard title="New User & Referral Bonus">
        <v-text-field v-model="bonusSettings.newUser" label="New User Bonus (Coins)" type="number" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="bonusSettings.referral" label="Referral Bonus (Coins)" type="number" variant="outlined" class="mb-4"></v-text-field>
        <v-btn color="primary" block @click="saveBonusSettings">Save Bonuses</v-btn>
      </UiParentCard>
    </v-col>
    <v-col cols="12" md="6">
      <UiParentCard title="Recharge & Festive Bonuses">
        <v-text-field v-model="bonusSettings.firstRecharge" label="First Recharge Bonus (%)" type="number" variant="outlined" class="mb-4"></v-text-field>
        <v-switch v-model="bonusSettings.festiveBonus" label="Enable Festive 10% Extra Bonus" color="success" hide-details class="mb-4"></v-switch>
        <v-btn color="secondary" block @click="saveBonusSettings">Update Festive Bonus</v-btn>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
