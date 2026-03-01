<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Host Verification' });
const pendingHosts = ref<any[]>([]);

const fetchPendingHosts = async () => {
  try {
    const res = await axios.get('https://kairo-b1i9.onrender.com/api/hosts');
    // Filter by isVerified field from MongoDB Host model
    pendingHosts.value = res.data.filter((h: any) => h.isVerified === false);
  } catch (error) {
    console.error("Error fetching hosts:", error);
  }
};

const approveHost = async (id: string) => {
  try {
    // Matching backend route: POST /api/hosts/:id/verify
    await axios.post(`https://kairo-b1i9.onrender.com/api/hosts/${id}/verify`, { isVerified: true });
    fetchPendingHosts();
  } catch (error) {
    console.error("Error approving host:", error);
  }
};

const rejectHost = async (id: string) => {
  if(confirm("Are you sure you want to delete/reject this host registration?")) {
    try {
      await axios.delete(`https://kairo-b1i9.onrender.com/api/hosts/${id}`);
      fetchPendingHosts();
    } catch (error) {
      console.error("Error rejecting host:", error);
    }
  }
};

onMounted(fetchPendingHosts);

const breadcrumbs = shallowRef([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Host Verification', disabled: true, href: '#' }
]);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Pending Verifications">
        <v-row v-if="pendingHosts.length">
          <v-col cols="12" md="4" v-for="host in pendingHosts" :key="host._id">
            <v-card variant="outlined" class="pa-4 border-opacity-25" rounded="lg">
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" color="grey-lighten-4" class="mr-4">
                   <v-icon color="grey-darken-1">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <h3 class="text-h6 font-weight-bold">{{ host.name }}</h3>
                  <p class="text-caption text-medium-emphasis mb-0">Email: {{ host.email }}</p>
                  <p class="text-caption text-medium-emphasis">ID: {{ host._id }}</p>
                </div>
                <v-chip color="warning" class="ml-auto" size="x-small" variant="flat">Pending</v-chip>
              </div>
              <v-divider class="mb-4"></v-divider>
              
              <v-list density="compact" class="bg-transparent mb-4">
                  <v-list-item prepend-icon="mdi-file-document-outline" title="View ID Documents" link color="primary" rounded="md"></v-list-item>
                  <v-list-item prepend-icon="mdi-video-outline" title="View Profile Video" link color="secondary" rounded="md"></v-list-item>
              </v-list>

              <div class="d-flex gap-4">
                <v-btn color="success" block variant="flat" class="flex-grow-1" @click="approveHost(host._id)">Approve</v-btn>
                <v-btn color="error" block variant="tonal" class="flex-grow-1" @click="rejectHost(host._id)">Reject</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else type="info" variant="tonal" border="start">
          No pending host verification requests at the moment.
        </v-alert>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
