<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-4">User Rewards & Badges</h2>
        <p class="text-subtitle-1 text-grey mb-6">Manage Zora Points and view user badges. Users earn 5 points for daily login.</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center pa-4">
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
                <th class="text-left">User</th>
                <th class="text-left">Email</th>
                <th class="text-left">Zora Points</th>
                <th class="text-left">Badge</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._id">
                <td>{{ user.name || user.nickname }}</td>
                <td>{{ user.email }}</td>
                <td class="font-weight-bold">{{ user.zoraPoints || 0 }}</td>
                <td>
                  <v-chip
                    :style="`background-color: ${user.badge?.color || '#808080'}; color: ${['#FFD700', '#B9F2FF'].includes(user.badge?.color) ? '#000' : '#FFF'}`"
                    size="small"
                  >
                    {{ user.badge?.name || 'Newbie' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn
                    size="small"
                    color="primary"
                    prepend-icon="mdi-pencil"
                    @click="openEditDialog(user)"
                  >
                    Edit Points
                  </v-btn>
                </td>
              </tr>
              <tr v-if="users.length === 0 && !loading">
                <td colspan="5" class="text-center py-4">No users found.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="5" class="text-center py-4"><v-progress-circular indeterminate color="primary"></v-progress-circular></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit Points Dialog -->
    <v-dialog v-model="dialog" max-width="400px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Edit Zora Points</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <p class="mb-4">Updating points for: <strong>{{ selectedUser?.name }}</strong></p>
                <v-text-field 
                  v-model="editPoints" 
                  label="Zora Points" 
                  type="number"
                  min="0"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="text" @click="savePoints">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'https://kairo-b1i9.onrender.com';

const users = ref<any[]>([]);
const loading = ref(true);
const search = ref('');

const dialog = ref(false);
const selectedUser = ref<any>(null);
const editPoints = ref<number | string>(0);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const s = search.value.toLowerCase();
  return users.value.filter(u => 
    (u.name && u.name.toLowerCase().includes(s)) ||
    (u.email && u.email.toLowerCase().includes(s))
  );
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`);
    users.value = Array.isArray(response.data) ? response.data : response.data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

const openEditDialog = (user: any) => {
  selectedUser.value = user;
  editPoints.value = user.zoraPoints || 0;
  dialog.value = true;
};

const savePoints = async () => {
  if (!selectedUser.value) return;

  try {
    const res = await axios.put(`${API_BASE_URL}/api/users/${selectedUser.value._id}/points`, {
      points: Number(editPoints.value)
    });
    
    // Update local state
    const index = users.value.findIndex(u => u._id === selectedUser.value._id);
    if (index !== -1) {
      users.value[index].zoraPoints = Number(editPoints.value);
      if (res.data.badge) {
         users.value[index].badge = res.data.badge;
      }
    }
    
    dialog.value = false;
    showSnackbar('Points updated successfully');
  } catch (error) {
    console.error('Error updating points:', error);
    showSnackbar('Failed to update points', 'error');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>
