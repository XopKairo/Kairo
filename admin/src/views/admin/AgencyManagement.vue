<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Agency Management' });
const agencies = ref<any[]>([]);
const dialog = ref(false);
const newAgency = ref({ name: '', owner: '', commission: 10 });

const fetchAgencies = async () => {
  const res = await axios.get('https://kairo-b1i9.onrender.com/api/agencies');
  agencies.value = res.data;
};

const saveAgency = async () => {
  await axios.post('https://kairo-b1i9.onrender.com/api/agencies', newAgency.value);
  dialog.value = false;
  newAgency.value = { name: '', owner: '', commission: 10 };
  fetchAgencies();
};

const deleteAgency = async (id: number) => {
  if (confirm("Delete this agency?")) {
    await axios.delete(`https://kairo-b1i9.onrender.com/api/agencies/${id}`);
    fetchAgencies();
  }
};

onMounted(fetchAgencies);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Partner Agencies">
        <template v-slot:action>
          <v-btn color="primary" @click="dialog = true">Register New Agency</v-btn>
        </template>
        <v-table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Commission (%)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="agency in agencies" :key="agency.id">
              <td>{{ agency.name }}</td>
              <td>{{ agency.owner }}</td>
              <td>{{ agency.commission }}%</td>
              <td>
                <v-btn icon color="error" variant="text" @click="deleteAgency(agency.id)"><v-icon>mdi-delete</v-icon></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-dialog v-model="dialog" max-width="500px">
    <v-card class="pa-4">
      <v-card-title>Add New Agency</v-card-title>
      <v-text-field v-model="newAgency.name" label="Agency Name" variant="outlined" class="mt-4"></v-text-field>
      <v-text-field v-model="newAgency.owner" label="Owner Name" variant="outlined"></v-text-field>
      <v-text-field v-model="newAgency.commission" label="Commission (%)" type="number" variant="outlined"></v-text-field>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveAgency">Save</v-btn>
        <v-btn @click="dialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
