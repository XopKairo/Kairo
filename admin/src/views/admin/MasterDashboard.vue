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
      <v-col cols="12" md="6">
        <v-card elevation="2" class="pa-4">
          <v-card-title class="text-h6">Live Active Sessions</v-card-title>
          <v-card-text>
            <div style="height: 250px;">
              <LineChart v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
              <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card elevation="2" class="pa-4">
          <v-card-title class="text-h6">6-Month Growth Trends</v-card-title>
          <v-card-text>
            <div style="height: 250px;">
              <LineChart v-if="historicalData" :data="historicalChartData" :options="historicalChartOptions" />
              <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Stats Summary -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 text-center">
          <div class="text-h4 font-weight-bold text-primary">{{ totalUsers }}</div>
          <div class="text-subtitle-2 text-grey">TOTAL USERS</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 text-center">
          <div class="text-h4 font-weight-bold text-success">{{ activeSessions }}</div>
          <div class="text-subtitle-2 text-grey">ACTIVE CALLS</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 text-center">
          <div class="text-h4 font-weight-bold text-warning">{{ totalCoinsCirculating }}</div>
          <div class="text-subtitle-2 text-grey">COINS IN CIRCULATION</div>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="pa-4 orange lighten-5">
            <v-icon color="orange" start>mdi-face-recognition</v-icon>
            <span class="text-h6">Pending Gender Verifications</span>
          </v-card-title>
          <v-table>
            <thead>
              <tr>
                <th>User</th>
                <th>Selected Gender</th>
                <th>Selfie Photo</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in verificationRequests" :key="req._id">
                <td>{{ req.userId?.name }}<br><small>{{ req.userId?.email }}</small></td>
                <td>
                   <v-chip :color="req.userId?.gender === 'Female' ? 'pink' : 'blue'" size="small">
                    {{ req.userId?.gender }}
                   </v-chip>
                </td>
                <td>
                  <v-img :src="req.photoUrl" width="100" height="100" class="rounded grey lighten-2" @click="viewImage(req.photoUrl)"></v-img>
                </td>
                <td>
                  <v-btn color="success" size="small" class="mr-2" @click="updateVerificationStatus(req._id, 'approved')">Approve</v-btn>
                  <v-btn color="error" size="small" @click="updateVerificationStatus(req._id, 'rejected')">Reject</v-btn>
                </td>
              </tr>
              <tr v-if="verificationRequests.length === 0">
                <td colspan="4" class="text-center py-4">No pending verification requests.</td>
              </tr>
            </tbody>
          </v-table>
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
                <th class="text-left">Gender Verified</th>
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
                  <v-chip :color="user.isGenderVerified ? 'success' : 'warning'" size="small">
                    {{ user.isGenderVerified ? 'Verified' : 'Unverified' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn size="small" :color="user.isBanned ? 'success' : 'error'" @click="toggleBanUser(user)" class="mr-2">
                    {{ user.isBanned ? 'Unban' : 'Ban' }}
                  </v-btn>
                  <v-btn size="small" color="error" variant="tonal" icon="mdi-delete" @click="deleteUser(user._id)"></v-btn>
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

    <!-- Image Viewer Dialog -->
    <v-dialog v-model="imageDialog" max-width="800px">
      <v-card>
        <v-img :src="dialogImage" width="100%"></v-img>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="imageDialog = false">Close</v-btn>
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

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const users = ref<any[]>([]);
const verificationRequests = ref<any[]>([]);
const search = ref('');
const totalUsers = ref(0);
const activeSessions = ref(0);
const totalCoinsCirculating = ref(0);
const adminRevenue = ref(0);
const historicalData = ref<any>(null);

const adminWithdrawDialog = ref(false);
const withdrawAmount = ref('');
const paymentDetails = ref('');
const withdrawing = ref(false);

const imageDialog = ref(false);
const dialogImage = ref('');

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

const historicalChartData = computed(() => ({
  labels: historicalData.value?.labels || [],
  datasets: [
    {
      label: 'New Users',
      borderColor: '#1867C0',
      backgroundColor: 'rgba(24, 103, 192, 0.1)',
      data: historicalData.value?.userGrowth || [],
      fill: true,
      tension: 0.4
    },
    {
      label: 'Revenue (INR)',
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      data: historicalData.value?.revenueData || [],
      fill: true,
      tension: 0.4
    }
  ]
}));

const historicalChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } },
  plugins: { legend: { display: true, position: 'bottom' as const } }
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

const viewImage = (url: string) => {
  dialogImage.value = url;
  imageDialog.value = true;
};

const fetchData = async () => {
  try {
    const [usersRes, statsRes, verRes, analyticsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/users`),
      axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`),
      axios.get(`${API_BASE_URL}/api/verification`),
      axios.get(`${API_BASE_URL}/api/admin/dashboard/analytics`)
    ]);
    users.value = usersRes.data || [];
    totalUsers.value = statsRes.data.totalUsers || 0;
    totalCoinsCirculating.value = statsRes.data.totalCoins || 0;
    adminRevenue.value = statsRes.data.totalRevenue || 0;
    verificationRequests.value = verRes.data.filter((r: any) => r.status === 'pending');
    historicalData.value = analyticsRes.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    showSnackbar('Failed to load real-time data from server.', 'error');
  }
};

const updateVerificationStatus = async (id: string, status: string) => {
  try {
    await axios.post(`${API_BASE_URL}/api/verification/${id}/status`, { status });
    showSnackbar(`Verification ${status} successfully.`);
    fetchData();
  } catch (err) {
    showSnackbar('Failed to update verification status.', 'error');
  }
};

const requestAdminWithdraw = async () => {
  if (!withdrawAmount.value || Number(withdrawAmount.value) <= 0) return;
  withdrawing.value = true;
  try {
    const adminData = JSON.parse(localStorage.getItem('user') || '{}');
    await axios.post(`${API_BASE_URL}/api/wallet/withdraw`, {
      userId: adminData._id,
      amountCoins: Number(withdrawAmount.value) * 10,
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

const deleteUser = async (id: string) => {
  if (!confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
  try {
    await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`);
    showSnackbar('User deleted successfully.');
    fetchData();
  } catch (error) {
    showSnackbar('Failed to delete user.', 'error');
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
  if (analyticsInterval) clearInterval(analyticsInterval);
  analyticsInterval = setInterval(updateAnalytics, 10000);
});

onUnmounted(() => {
  if (analyticsInterval) clearInterval(analyticsInterval);
});
</script>
