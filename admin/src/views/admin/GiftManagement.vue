<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Manage Gifts & Pricing' });
const gifts = ref<any[]>([]);
const dialog = ref(false);
const editedGift = ref<any>({ name: '', coinCost: 0, category: 'Basic', isActive: true });
const selectedFile = ref<File | null>(null);

const fetchGifts = async () => {
  const res = await axios.get('https://kairo-b1i9.onrender.com/api/economy/gifts');
  gifts.value = res.data;
};

const handleFileChange = (e: any) => {
  if (e.target.files.length > 0) {
    selectedFile.value = e.target.files[0];
  }
};

const saveGift = async () => {
  const formData = new FormData();
  formData.append('name', editedGift.value.name);
  formData.append('coinCost', editedGift.value.coinCost);
  formData.append('isActive', editedGift.value.isActive);
  if (selectedFile.value) {
    formData.append('icon', selectedFile.value);
  }

  if (editedGift.value._id) {
    await axios.put(`https://kairo-b1i9.onrender.com/api/economy/gifts/${editedGift.value._id}`, formData);
  } else {
    await axios.post('https://kairo-b1i9.onrender.com/api/economy/gifts', formData);
  }
  dialog.value = false;
  selectedFile.value = null;
  fetchGifts();
};

const deleteGift = async (id: string) => {
  if (confirm("Delete this gift?")) {
    await axios.delete(`https://kairo-b1i9.onrender.com/api/economy/gifts/${id}`);
    fetchGifts();
  }
};

onMounted(fetchGifts);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="App Gifts">
        <template v-slot:action>
          <v-btn color="primary" @click="editedGift = {name:'', price:0, category:'Basic', status:'Active'}; dialog = true;">Add New Gift</v-btn>
        </template>
        <v-table>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Gift Name</th>
              <th>Cost (Coins)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gift in gifts" :key="gift._id">
              <td>
                <img v-if="gift.iconUrl" :src="'https://kairo-b1i9.onrender.com' + gift.iconUrl" alt="icon" style="width: 40px; height: 40px; object-fit: contain;" />
              </td>
              <td>{{ gift.name }}</td>
              <td>{{ gift.coinCost }}</td>
              <td>
                <v-chip :color="gift.isActive ? 'success' : 'error'" size="x-small">
                  {{ gift.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
              </td>
              <td>
                <v-btn icon color="primary" variant="text" @click="editedGift = {...gift}; dialog = true;"><v-icon>mdi-pencil</v-icon></v-btn>
                <v-btn icon color="error" variant="text" @click="deleteGift(gift._id)"><v-icon>mdi-delete</v-icon></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-dialog v-model="dialog" max-width="500px">
    <v-card class="pa-4">
      <v-card-title>Edit Gift</v-card-title>
      <v-text-field v-model="editedGift.name" label="Gift Name" variant="outlined"></v-text-field>
      <v-text-field v-model="editedGift.coinCost" label="Cost (Coins)" type="number" variant="outlined"></v-text-field>
      <v-switch v-model="editedGift.isActive" label="Active Status"></v-switch>
      <v-file-input accept="image/*" label="Upload Custom Icon" @change="handleFileChange" variant="outlined"></v-file-input>
      <v-card-actions>
        <v-btn color="primary" @click="saveGift">Save</v-btn>
        <v-btn @click="dialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
