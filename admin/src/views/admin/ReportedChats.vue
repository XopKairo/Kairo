<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-4">Reported Chats</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Reporter</th>
                <th class="text-left">Reported User</th>
                <th class="text-left">Message Content</th>
                <th class="text-left">Reason</th>
                <th class="text-left">Status</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report._id">
                <td>{{ report.reporterId?.name || 'Unknown' }}</td>
                <td>{{ report.reportedUserId?.name || 'Unknown' }}</td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <v-tooltip activator="parent" location="top">{{ report.messageId?.content }}</v-tooltip>
                  "{{ report.messageId?.content || 'Message deleted' }}"
                </td>
                <td>{{ report.reason }}</td>
                <td>
                  <v-chip
                    :color="getStatusColor(report.status)"
                    size="small"
                  >
                    {{ report.status.toUpperCase() }}
                  </v-chip>
                </td>
                <td>
                  <v-btn
                    v-if="report.status === 'pending'"
                    size="small"
                    color="warning"
                    class="mr-2"
                    @click="updateStatus(report._id, 'reviewed')"
                  >
                    Review
                  </v-btn>
                  <v-btn
                    v-if="report.status === 'pending'"
                    size="small"
                    color="grey"
                    @click="updateStatus(report._id, 'dismissed')"
                  >
                    Dismiss
                  </v-btn>
                  <v-btn
                    v-if="report.status === 'reviewed'"
                    size="small"
                    color="error"
                    @click="banUser(report.reportedUserId?._id)"
                  >
                    Ban User
                  </v-btn>
                </td>
              </tr>
              <tr v-if="reports.length === 0 && !loading">
                <td colspan="6" class="text-center py-4">No reported chats found.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-4"><v-progress-circular indeterminate color="primary"></v-progress-circular></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'https://kairo-novh.onrender.com';

const reports = ref<any[]>([]);
const loading = ref(true);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const getStatusColor = (status: string) => {
  if (status === 'reviewed') return 'warning';
  if (status === 'dismissed') return 'grey';
  return 'error'; // pending
};

const fetchReports = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chat/reports`);
    reports.value = response.data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (id: string, status: string) => {
  try {
    await axios.put(`${API_BASE_URL}/api/chat/reports/${id}/status`, { status });
    const report = reports.value.find(r => r._id === id);
    if (report) report.status = status;
    showSnackbar(`Report marked as ${status}`);
  } catch (error) {
    console.error(`Error updating report status:`, error);
    showSnackbar('Failed to update status', 'error');
  }
};

const banUser = async (userId: string) => {
  if (!userId) return;
  if (!confirm('Are you sure you want to ban this user based on this report?')) return;
  
  try {
    await axios.post(`${API_BASE_URL}/api/users/${userId}/ban`, { isBanned: true });
    showSnackbar('User banned successfully');
  } catch (error) {
    console.error('Ban error:', error);
    showSnackbar('Failed to ban user', 'error');
  }
};

onMounted(() => {
  fetchReports();
});
</script>
