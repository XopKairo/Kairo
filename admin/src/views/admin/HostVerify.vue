<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Host Verification' });
const pendingHosts = ref<any[]>([]);

const fetchPendingHosts = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/hosts');
  pendingHosts.value = res.data.filter((h: any) => !h.is_verified);
};

const approveHost = async (id: number) => {
  await axios.put(`https://kairo-novh.onrender.com/api/hosts/${id}/verify`, { is_verified: 1 });
  fetchPendingHosts();
};

const rejectHost = async (id: number) => {
  // In a real scenario, you might have a reason for rejection or delete the host
  await axios.delete(`https://kairo-novh.onrender.com/api/hosts/${id}`);
  fetchPendingHosts();
};

onMounted(fetchPendingHosts);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Pending Verifications">
        <v-row v-if="pendingHosts.length">
          <v-col cols="12" md="6" v-for="host in pendingHosts" :key="host.id">
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex align-center mb-4">
                <v-avatar size="60" color="grey-lighten-2" class="mr-4"></v-avatar>
                <div>
                  <h3 class="text-h6">{{ host.name }}</h3>
                  <p class="text-body-2 text-medium-emphasis">ID: {{ host.id }}</p>
                </div>
                <v-chip color="warning" class="ml-auto" size="small">Pending</v-chip>
              </div>
              <v-divider class="mb-4"></v-divider>
              <div class="d-flex justify-space-between mb-4">
                <v-btn color="primary" variant="tonal" size="small">View ID Documents</v-btn>
                <v-btn color="secondary" variant="tonal" size="small">View Profile Video</v-btn>
              </div>
              <div class="d-flex gap-2">
                <v-btn color="success" block class="mr-2" @click="approveHost(host.id)">Approve</v-btn>
                <v-btn color="error" block @click="rejectHost(host.id)">Reject</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else type="info" variant="tonal">No pending host verification requests.</v-alert>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
