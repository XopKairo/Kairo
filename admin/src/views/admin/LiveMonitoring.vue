<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

const page = ref({ title: 'Live Monitoring Wall' });
const breadcrumbs = shallowRef([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Live Monitoring', disabled: true, href: '#' }
]);

const activeCalls = ref<any[]>([]);
let socket: any = null;

const fetchActiveCalls = async () => {
  try {
    const res = await axios.get('https://kairo-b1i9.onrender.com/api/monitoring/active');
    activeCalls.value = res.data;
  } catch (err) {
    console.error("Failed to fetch active calls", err);
  }
};

const terminateCall = async (callId: string) => {
  if (confirm("Are you sure you want to terminate this call?")) {
    try {
      await axios.post(`https://kairo-b1i9.onrender.com/api/monitoring/force-end/${callId}`);
      fetchActiveCalls(); // Refresh list
    } catch (err) {
      console.error("Failed to terminate call", err);
    }
  }
};

onMounted(() => {
  fetchActiveCalls();
  
  // Setup Socket connection
  socket = io('https://kairo-b1i9.onrender.com');
  
  socket.on('connect', () => {
    socket.emit('joinAdminRoom'); // Optional, if you have specific room logic
  });

  socket.on('callStartedAlert', (data: any) => {
    // When a new call starts, refresh the list to show it immediately
    fetchActiveCalls();
  });
  
  socket.on('callForceEnded', (data: any) => {
     fetchActiveCalls();
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <div class="d-flex align-center mb-4">
        <h3 class="text-h5">Ongoing Video Calls ({{ activeCalls.length }})</h3>
        <v-chip color="error" class="ml-4" size="small" variant="flat">LIVE</v-chip>
      </div>
      <v-row>
        <v-col cols="12" sm="6" md="4" lg="3" v-for="call in activeCalls" :key="call._id">
          <v-card class="overflow-hidden">
            <div style="aspect-ratio: 9/16; background: #1a1a1a; position: relative;" class="d-flex align-center justify-center">
               <!-- Placeholder for actual ZegoCloud Web SDK video view -->
               <div class="text-center">
                 <v-icon size="48" color="success" class="mb-2">mdi-video</v-icon>
                 <div class="text-caption text-success">Live Stream Active</div>
                 <div class="text-caption text-grey">ID: {{ call.callId.substring(0, 6) }}...</div>
               </div>
               
               <div style="position: absolute; top: 10px; left: 10px;">
                 <v-chip color="error" size="x-small" variant="flat">LIVE</v-chip>
               </div>
               <div style="position: absolute; bottom: 10px; left: 10px; color: white;">
                 <div class="text-caption font-weight-bold">Host: {{ call.hostId?.name || 'Unknown' }}</div>
                 <div class="text-caption" style="font-size: 10px !important;">User: {{ call.userId?.name || 'Unknown' }}</div>
               </div>
            </div>
            <v-card-actions class="bg-surface">
              <!-- Feature: View Video (Requires Zego Web SDK implementation) -->
              <v-btn color="primary" variant="text" size="small">Watch</v-btn>
              <v-spacer></v-spacer>
              <v-btn color="error" variant="flat" size="small" @click="terminateCall(call.callId)">Terminate</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" v-if="activeCalls.length === 0">
           <v-alert type="info" variant="tonal">No active video calls right now.</v-alert>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
