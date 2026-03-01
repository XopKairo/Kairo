<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2 class="text-h4 mb-4">Interest Tags Management</h2>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()" variant="flat">Add New Real Tag</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Icon</th>
                <th class="text-left">Name</th>
                <th class="text-left">Status</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tag in tags" :key="tag._id">
                <td class="text-h6">{{ tag.icon || '🏷️' }}</td>
                <td class="font-weight-medium">{{ tag.name }}</td>
                <td>
                  <v-chip :color="tag.isActive ? 'success' : 'grey'" size="small" variant="flat">
                    {{ tag.isActive ? 'Active' : 'Inactive' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn size="small" color="primary" variant="text" icon="mdi-pencil" @click="openDialog(tag)"></v-btn>
                  <v-btn size="small" color="error" variant="text" icon="mdi-delete" @click="deleteTag(tag._id)"></v-btn>
                </td>
              </tr>
              <tr v-if="tags.length === 0 && !loading">
                <td colspan="4" class="text-center py-8">
                  <v-icon size="48" color="grey-lighten-2">mdi-tag-off</v-icon>
                  <div class="text-grey-lighten-1 mt-2">No real interest tags found in database.</div>
                </td>
              </tr>
              <tr v-if="loading">
                <td colspan="4" class="text-center py-4"><v-progress-circular indeterminate color="primary"></v-progress-circular></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog for Create/Edit -->
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card class="pa-4">
        <v-card-title>
          <span class="text-h5 font-weight-bold">{{ isEditing ? 'Edit Real Interest Tag' : 'New Real Interest Tag' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.icon" label="Icon (Emoji)" placeholder="e.g. 🎵" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field v-model="editedItem.name" label="Tag Name*" required variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-switch v-model="editedItem.isActive" label="Active Status (Live in App)" color="success" inset></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveTag">Save to Database</v-btn>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'https://kairo-b1i9.onrender.com';

const tags = ref<any[]>([]);
const loading = ref(true);

const dialog = ref(false);
const isEditing = ref(false);
const editedItem = ref({ _id: '', name: '', icon: '', isActive: true });

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const fetchTags = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/interests`);
    // Ensure we only use real data, no mock fallback
    tags.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching real tags:', error);
    showSnackbar('Failed to fetch real-time tags from database.', 'error');
    tags.value = [];
  } finally {
    loading.value = false;
  }
};

const openDialog = (item?: any) => {
  if (item) {
    isEditing.value = true;
    editedItem.value = { ...item };
  } else {
    isEditing.value = false;
    editedItem.value = { _id: '', name: '', icon: '', isActive: true };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
};

const saveTag = async () => {
  if (!editedItem.value.name) {
    showSnackbar('Tag name is mandatory', 'error');
    return;
  }

  try {
    if (isEditing.value) {
      await axios.put(`${API_BASE_URL}/api/interests/${editedItem.value._id}`, editedItem.value);
      showSnackbar('Tag updated in database successfully');
    } else {
      await axios.post(`${API_BASE_URL}/api/interests`, editedItem.value);
      showSnackbar('New tag created in database successfully');
    }
    closeDialog();
    fetchTags();
  } catch (error) {
    console.error('Error saving real tag:', error);
    showSnackbar('Failed to save tag to database.', 'error');
  }
};

const deleteTag = async (id: string) => {
  if (!confirm('Permanently delete this interest tag from the database?')) return;
  
  try {
    await axios.delete(`${API_BASE_URL}/api/interests/${id}`);
    showSnackbar('Tag removed from database successfully');
    fetchTags();
  } catch (error) {
    console.error('Error deleting real tag:', error);
    showSnackbar('Failed to delete tag from database.', 'error');
  }
};

onMounted(() => {
  fetchTags();
});
</script>
