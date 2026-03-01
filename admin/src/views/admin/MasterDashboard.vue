<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-4">Master Dashboard</h2>
      </v-col>
    </v-row>

    <!-- Analytics Section using Chart.js -->
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
            <div class="text-subtitle-1 text-grey">Active Sessions</div>
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
                <th class="text-left">Email</th>
                <th class="text-left">Status</th>
                <th class="text-left">Verification</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._id">
                <td>{{ user.name || user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <v-chip
                    :color="user.isBanned ? 'error' : 'success'"
                    size="small"
                  >
                    {{ user.isBanned ? 'Banned' : 'Active' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="user.isVerified ? 'primary' : 'warning'"
                    size="small"
                  >
                    {{ user.isVerified ? 'Verified' : 'Pending' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn
                    size="small"
                    :color="user.isVerified ? 'grey' : 'primary'"
                    class="mr-2"
                    @click="verifyUser(user._id)"
                    :disabled="user.isVerified"
                  >
                    Verify
                  </v-btn>
                  <v-btn
                    size="small"
                    :color="user.isBanned ? 'success' : 'error'"
                    @click="toggleBanUser(user)"
                  >
                    {{ user.isBanned ? 'Unban' : 'Ban' }}
                  </v-btn>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="5" class="text-center py-4">No users found or loading...</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Action Snackbar -->
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'https://kairo-novh.onrender.com';

// State
const users = ref<any[]>([]);
const search = ref('');
const totalUsers = ref(0);
const activeSessions = ref(0);

// Snackbar State
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Chart Data
const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Active Users (Real-time)',
      backgroundColor: '#f87979',
      borderColor: '#f87979',
      data: [] as number[],
      tension: 0.4
    }
  ]
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
};

let analyticsInterval: any = null;

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const s = search.value.toLowerCase();
  return users.value.filter(u => 
    (u.name && u.name.toLowerCase().includes(s)) ||
    (u.username && u.username.toLowerCase().includes(s)) ||
    (u.email && u.email.toLowerCase().includes(s))
  );
});

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

// Fetch Users (Assuming a basic /api/admin/users endpoint exists on the backend, modify as needed)
const fetchUsers = async () => {
  try {
    // Attempting to fetch from backend. Adjust endpoint path based on actual backend implementation.
    const response = await axios.get(`${API_BASE_URL}/api/users`);
    if (response.data) {
       // If backend returns data array, use it. Otherwise populate with mock if API fails for demo.
       users.value = Array.isArray(response.data) ? response.data : response.data.users || [];
       totalUsers.value = users.value.length;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    // Fallback Mock data for visual demonstration if endpoint isn't ready
    if(users.value.length === 0) {
        users.value = [
            { _id: '1', name: 'John Doe', email: 'john@example.com', isBanned: false, isVerified: true },
            { _id: '2', name: 'Jane Smith', email: 'jane@example.com', isBanned: true, isVerified: false },
            { _id: '3', name: 'Alex Johnson', email: 'alex@example.com', isBanned: false, isVerified: false },
        ];
        totalUsers.value = 156;
    }
  }
};

const verifyUser = async (userId: string) => {
  try {
    // Example endpoint for verifying user
    await axios.post(`${API_BASE_URL}/api/admin/users/${userId}/verify`);
    
    // Update local state
    const user = users.value.find(u => u._id === userId);
    if (user) user.isVerified = true;
    
    showSnackbar('User profile verified successfully.');
  } catch (error) {
    console.error('Verify error:', error);
    // Fallback for UI if API fails
    const user = users.value.find(u => u._id === userId);
    if (user) user.isVerified = true;
    showSnackbar('User profile verified (Simulated).', 'warning');
  }
};

const toggleBanUser = async (user: any) => {
  try {
    const action = user.isBanned ? 'unban' : 'ban';
    await axios.post(`${API_BASE_URL}/api/admin/users/${user._id}/${action}`);
    
    user.isBanned = !user.isBanned;
    showSnackbar(`User has been ${user.isBanned ? 'banned' : 'unbanned'}.`);
  } catch (error) {
    console.error('Ban error:', error);
    user.isBanned = !user.isBanned;
    showSnackbar(`User ${user.isBanned ? 'banned' : 'unbanned'} (Simulated).`, 'warning');
  }
};

const updateAnalytics = () => {
  // Simulate real-time data fetching for the chart
  const now = new Date();
  const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  // Simulated active sessions count (replace with real WebSocket/Polling data from Render backend)
  const newActiveCount = Math.floor(Math.random() * 50) + 100; 
  activeSessions.value = newActiveCount;

  const newLabels = [...chartData.value.labels, timeString];
  const newData = [...chartData.value.datasets[0].data, newActiveCount];

  // Keep last 10 data points
  if (newLabels.length > 10) {
    newLabels.shift();
    newData.shift();
  }

  // Reactive update for Vue Chart.js
  chartData.value = {
    labels: newLabels,
    datasets: [{
      ...chartData.value.datasets[0],
      data: newData
    }]
  };
};

onMounted(() => {
  fetchUsers();
  
  // Initial chart data
  updateAnalytics();
  
  // Polling for real-time analytics updates
  analyticsInterval = setInterval(updateAnalytics, 3000);
});

onUnmounted(() => {
  if (analyticsInterval) clearInterval(analyticsInterval);
});
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>
