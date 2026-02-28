<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Manage Coin Prices' });
const packages = ref<any[]>([]);
const dialog = ref(false);
const editedItem = ref<any>({ name: '', coins: 0, price: 0, bonus: 0 });

const fetchPackages = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/economy/coins');
  packages.value = res.data;
};

const savePackage = async () => {
  if (editedItem.value._id) {
    await axios.put(`https://kairo-novh.onrender.com/api/economy/coins/${editedItem.value._id}`, editedItem.value);
  } else {
    await axios.post('https://kairo-novh.onrender.com/api/economy/coins', editedItem.value);
  }
  dialog.value = false;
  fetchPackages();
};

const deletePackage = async (id: string) => {
  if(confirm("Delete this package?")) {
    await axios.delete(`https://kairo-novh.onrender.com/api/economy/coins/${id}`);
    fetchPackages();
  }
};

onMounted(fetchPackages);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Active Coin Packages">
        <template v-slot:action>
          <v-btn color="primary" @click="editedItem = {name:'', coins:0, price:0, bonus:0}; dialog = true;">Add New Package</v-btn>
        </template>
        <v-table>
          <thead>
            <tr>
              <th>Package Name</th>
              <th>Coins</th>
              <th>Bonus</th>
              <th>Price (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pkg in packages" :key="pkg._id">
              <td>{{ pkg.name || 'Coins' }}</td>
              <td>{{ pkg.coins }}</td>
              <td>+{{ pkg.bonus || 0 }}</td>
              <td>₹{{ pkg.priceINR }}</td>
              <td>
                <v-btn icon color="primary" variant="text" @click="editedItem = {...pkg}; dialog = true;"><v-icon>mdi-pencil</v-icon></v-btn>
                <v-btn icon color="error" variant="text" @click="deletePackage(pkg._id)"><v-icon>mdi-delete</v-icon></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>Edit Coin Package</v-card-title>
      <v-card-text>
        <v-text-field v-model="editedItem.name" label="Package Name"></v-text-field>
        <v-text-field v-model="editedItem.coins" label="Coins Amount" type="number"></v-text-field>
        <v-text-field v-model="editedItem.bonus" label="Bonus Coins" type="number"></v-text-field>
        <v-text-field v-model="editedItem.priceINR" label="Price (INR ₹)" type="number"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="savePackage">Save</v-btn>
        <v-btn @click="dialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
