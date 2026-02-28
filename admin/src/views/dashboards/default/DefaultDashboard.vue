<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import VueApexCharts from 'vue3-apexcharts';

const stats = ref({
  totalUsers: 0,
  totalCoins: 0,
  activeHosts: 0,
  pendingPayouts: 0
});

const chartData = ref<any[]>([]);

const fetchAnalytics = async () => {
  try {
    const res = await axios.get('https://kairo-b1i9.onrender.com/api/admin/analytics');
    stats.value = res.data;
    
    const dbRes = await axios.get('https://kairo-b1i9.onrender.com/api/revenueStats');
    chartData.value = dbRes.data;
  } catch (error) {
    console.error("Error fetching dashboard data");
  }
};

const chartOptions = {
  chart: { type: 'area', height: 350, toolbar: { show: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#673ab7'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
  xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
};

onMounted(fetchAnalytics);
</script>

<template>
  <v-row>
    <v-col cols="12" md="3">
      <v-card color="secondary" class="pa-6 text-white rounded-xl">
        <div class="text-subtitle-1 mb-1">Total Users</div>
        <div class="text-h2 font-weight-bold">{{ stats.totalUsers }}</div>
        <v-icon class="mt-4" size="32">mdi-account-group</v-icon>
      </v-card>
    </v-col>
    <v-col cols="12" md="3">
      <v-card color="primary" class="pa-6 text-white rounded-xl">
        <div class="text-subtitle-1 mb-1">Total Coins</div>
        <div class="text-h2 font-weight-bold">{{ stats.totalCoins }}</div>
        <v-icon class="mt-4" size="32">mdi-database</v-icon>
      </v-card>
    </v-col>
    <v-col cols="12" md="3">
      <v-card color="success" class="pa-6 text-white rounded-xl">
        <div class="text-subtitle-1 mb-1">Verified Hosts</div>
        <div class="text-h2 font-weight-bold">{{ stats.activeHosts }}</div>
        <v-icon class="mt-4" size="32">mdi-check-decagram</v-icon>
      </v-card>
    </v-col>
    <v-col cols="12" md="3">
      <v-card color="warning" class="pa-6 text-white rounded-xl">
        <div class="text-subtitle-1 mb-1">Pending Payouts</div>
        <div class="text-h2 font-weight-bold">{{ stats.pendingPayouts }}</div>
        <v-icon class="mt-4" size="32">mdi-cash-clock</v-icon>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h5 mb-6">Revenue Growth (Live from DB)</h3>
        <VueApexCharts type="area" height="350" :options="chartOptions" :series="[{ name: 'Revenue', data: chartData }]"></VueApexCharts>
      </v-card>
    </v-col>
  </v-row>
</template>
