<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h2 class="text-h4 mb-4">Master Dashboard</h2>
        <v-btn color="secondary" prepend-icon="mdi-bank-transfer" @click="adminWithdrawDialog = true" variant="flat">
          Withdraw My Revenue: ₹{{ adminRevenue }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Analytics Section -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="2" class="pa-4">
          <v-card-title class="text-h6">Real-Time App Analytics</v-card-title>
          <v-card-text>
            <div style="height: 300px;">
              <LineChart v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
              <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 h-100">
          <v-card-title class="text-h6">Quick Stats</v-card-title>
          <v-card-text class="d-flex flex-column justify-center align-center h-100">
            <div class="text-h3 font-weight-bold text-primary mb-2">{{ totalUsers }}</div>
            <div class="text-subtitle-1 text-grey">Total Registered Users</div>
            <v-divider class="my-4 w-100"></v-divider>
            <div class="text-h4 font-weight-bold text-success mb-2">{{ activeSessions }}</div>
            <div class="text-subtitle-1 text-grey">Active Calls</div>
            <v-divider class="my-4 w-100"></v-divider>
            <div class="text-h5 font-weight-bold text-warning mb-2">{{ totalCoinsCirculating }}</div>
            <div class="text-subtitle-2 text-grey">Coins in Circulation</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Management Section -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center pa-4">
            <span class="text-h6">User Management</span>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search Users"
              single-line
              hide-details
              density="compact"
              variant="outlined"
              class="max-w-xs"
              style="max-width: 300px;"
            ></v-text-field>
          </v-card-title>
          
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Gender</th>
                <th class="text-left">Coins</th>
                <th class="text-left">Status</th>
                <th class="text-left">Verification</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._id">
                <td>{{ user.name || 'N/A' }}</td>
                <td>
                  <v-chip :color="user.gender === 'Female' ? 'pink' : 'blue'" size="x-small" variant="tonal">
                    {{ user.gender }}
                  </v-chip>
                </td>
                <td>{{ user.coins || 0 }}</td>
                <td>
                  <v-chip :color="user.isBanned ? 'error' : 'success'" size="small">
                    {{ user.isBanned ? 'Banned' : 'Active' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip :color="user.isVerified ? 'primary' : 'warning'" size="small">
                    {{ user.isVerified ? 'Verified' : 'Pending' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn size="small" :color="user.isVerified ? 'grey' : 'primary'" class="mr-2" @click="verifyUser(user._id)" :disabled="user.isVerified">
                    Verify
                  </v-btn>
                  <v-btn size="small" :color="user.isBanned ? 'success' : 'error'" @click="toggleBanUser(user)">
                    {{ user.isBanned ? 'Unban' : 'Ban' }}
                  </v-btn>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="6" class="text-center py-4">No users found.</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Admin Withdrawal Dialog -->
    <v-dialog v-model="adminWithdrawDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h5 font-weight-bold">Withdraw Admin Revenue</v-card-title>
        <v-card-text>
          <div class="mb-4 text-subtitle-1">Available for Withdrawal: <span class="text-success font-weight-bold">₹{{ adminRevenue }}</span></div>
          <v-text-field v-model="withdrawAmount" label="Amount to Withdraw (INR)" type="number" variant="outlined"></v-text-field>
          <v-textarea v-model="paymentDetails" label="Your UPI ID or Bank Details" variant="outlined" placeholder="Enter where you want the cash to be sent"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="adminWithdrawDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="requestAdminWithdraw" :loading="withdrawing">Withdraw Now</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line as LineChart } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = 'https://kairo-b1i9.onrender.com';

const users = ref<any[]>([]);
const search = ref('');
const totalUsers = ref(0);
const activeSessions = ref(0);
const totalCoinsCirculating = ref(0);
const adminRevenue = ref(0);

const adminWithdrawDialog = ref(false);
const withdrawAmount = ref('');
const paymentDetails = ref('');
const withdrawing = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Active Calls',
      backgroundColor: '#1867C0',
      borderColor: '#1867C0',
      data: [] as number[],
      tension: 0.4
    }
  ]
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } },
  plugins: { legend: { display: false } }
};

let analyticsInterval: any = null;

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const s = search.value.toLowerCase();
  return users.value.filter(u => 
    (u.name && u.name.toLowerCase().includes(s)) ||
    (u.email && u.email.toLowerCase().includes(s))
  );
});

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const fetchData = async () => {
  try {
    const [usersRes, statsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/users`),
      axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`)
    ]);
    users.value = usersRes.data || [];
    totalUsers.value = statsRes.data.totalUsers || 0;
    totalCoinsCirculating.value = statsRes.data.totalCoins || 0;
    adminRevenue.value = statsRes.data.totalRevenue || 0;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    showSnackbar('Failed to load real-time data from server.', 'error');
  }
};

const requestAdminWithdraw = async () => {
  if (!withdrawAmount.value || Number(withdrawAmount.value) <= 0) return;
  withdrawing.value = true;
  try {
    const adminData = JSON.parse(localStorage.getItem('user') || '{}');
    await axios.post(`${API_BASE_URL}/api/wallet/withdraw`, {
      userId: adminData._id,
      amountCoins: Number(withdrawAmount.value) * 10, // Admin uses INR directly, conversion back to coins for the shared API
      paymentDetails: paymentDetails.value,
      isAdminWithdrawal: true
    });
    showSnackbar('Withdrawal request submitted successfully!');
    adminWithdrawDialog.value = false;
    fetchData();
  } catch (err: any) {
    showSnackbar(err.response?.data?.error || 'Withdrawal failed', 'error');
  } finally {
    withdrawing.value = false;
  }
};

const verifyUser = async (userId: string) => {
  try {
    await axios.post(`${API_BASE_URL}/api/admin/users/${userId}/verify`, { isVerified: true });
    const user = users.value.find(u => u._id === userId);
    if (user) user.isVerified = true;
    showSnackbar('User verified successfully.');
  } catch (error) {
    showSnackbar('Failed to verify user.', 'error');
  }
};

const toggleBanUser = async (user: any) => {
  try {
    const newBanStatus = !user.isBanned;
    await axios.post(`${API_BASE_URL}/api/admin/users/${user._id}/ban`, { isBanned: newBanStatus });
    user.isBanned = newBanStatus;
    showSnackbar(`User ${user.isBanned ? 'banned' : 'unbanned'} successfully.`);
  } catch (error) {
    showSnackbar('Failed to update ban status.', 'error');
  }
};

const updateAnalytics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/calls/active`);
    const activeCount = Array.isArray(response.data) ? response.data.length : 0;
    activeSessions.value = activeCount;

    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newLabels = [...chartData.value.labels, timeString];
    const newData = [...chartData.value.datasets[0].data, activeCount];

    if (newLabels.length > 15) {
      newLabels.shift();
      newData.shift();
    }

    chartData.value = {
      labels: newLabels,
      datasets: [{ ...chartData.value.datasets[0], data: newData }]
    };
  } catch (error) {
    console.error('Analytics update failed:', error);
  }
};

onMounted(() => {
  fetchData();
  updateAnalytics();
  analyticsInterval = setInterval(updateAnalytics, 10000);
});

onUnmounted(() => {
  if (analyticsInterval) clearInterval(analyticsInterval);
});
</script>
