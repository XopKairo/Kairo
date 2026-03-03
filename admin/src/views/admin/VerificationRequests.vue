<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-4">Verification Requests</h2>
        <v-card elevation="2">
          <v-table>
            <thead>
              <tr>
                <th class="text-left">User</th>
                <th class="text-left">Email</th>
                <th class="text-left">ID Photo</th>
                <th class="text-left">Selfie/Photo</th>
                <th class="text-left">Status</th>
                <th class="text-left">Submitted At</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in requests" :key="request._id">
                <td>{{ request.userId?.name || request.userId?.nickname || 'Unknown' }}</td>
                <td>{{ request.userId?.email || 'N/A' }}</td>
                <td>
                  <v-img :src="getFullUrl(request.idUrl)" width="50" height="50" cover class="bg-grey-lighten-2 rounded cursor-pointer" @click="viewImage(getFullUrl(request.idUrl))"></v-img>
                </td>
                <td>
                  <v-img :src="getFullUrl(request.photoUrl)" width="50" height="50" cover class="bg-grey-lighten-2 rounded cursor-pointer" @click="viewImage(getFullUrl(request.photoUrl))"></v-img>
                </td>
                <td>
                  <v-chip :color="getStatusColor(request.status)" size="small">
                    {{ request.status.toUpperCase() }}
                  </v-chip>
                </td>
                <td>{{ new Date(request.submittedAt).toLocaleDateString() }}</td>
                <td>
                  <v-btn v-if="request.status === 'pending'" size="small" color="success" class="mr-2" @click="updateStatus(request._id, 'approved', request.userId?._id)">
                    Approve
                  </v-btn>
                  <v-btn v-if="request.status === 'pending'" size="small" color="error" @click="updateStatus(request._id, 'rejected')">
                    Reject
                  </v-btn>
                  <span v-if="request.status !== 'pending'" class="text-caption text-grey">Processed</span>
                </td>
              </tr>
              <tr v-if="requests.length === 0 && !loading">
                <td colspan="7" class="text-center py-4">No real verification requests found in database.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4"><v-progress-circular indeterminate color="primary"></v-progress-circular></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Image Dialog -->
    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-text class="pa-0">
          <v-img :src="selectedImage" width="100%" contain max-height="80vh"></v-img>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const requests = ref<any[]>([]);
const loading = ref(true);
const dialog = ref(false);
const selectedImage = ref('');
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const getFullUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}/${url}`;
};

const viewImage = (url: string) => {
  selectedImage.value = url;
  dialog.value = true;
};

const getStatusColor = (status: string) => {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  return 'warning';
};

const fetchRequests = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/verification`);
    requests.value = response.data || [];
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    showSnackbar('Failed to fetch real-time verification requests.', 'error');
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (id: string, status: string, userId?: string) => {
  try {
    await axios.post(`${API_BASE_URL}/api/admin/verification/${id}/status`, { status });
    
    // If approved, also update User/Host verification status in DB
    if (status === 'approved' && userId) {
      await axios.post(`${API_BASE_URL}/api/admin/users/${userId}/verify`, { isVerified: true });
    }

    const request = requests.value.find(r => r._id === id);
    if (request) request.status = status;
    
    showSnackbar(`Verification request ${status} successfully.`);
  } catch (error) {
    console.error(`Error updating verification status:`, error);
    showSnackbar(`Failed to update verification status.`, 'error');
  }
};

onMounted(() => {
  fetchRequests();
});
</script>
