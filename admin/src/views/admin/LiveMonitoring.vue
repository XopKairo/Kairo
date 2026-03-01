<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const page = ref({ title: 'Live Monitoring Wall' });
const breadcrumbs = shallowRef([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Live Monitoring', disabled: true, href: '#' }
]);

const activeCalls = ref<any[]>([]);
const watchingCallId = ref<string | null>(null);
let socket: any = null;
let zp: any = null;

const API_BASE_URL = 'https://kairo-b1i9.onrender.com';

const fetchActiveCalls = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/calls/active`);
    activeCalls.value = res.data;
  } catch (err) {
    console.error("Failed to fetch active calls", err);
  }
};

const terminateCall = async (callId: string) => {
  if (confirm("Are you sure you want to terminate this call?")) {
    try {
      await axios.post(`${API_BASE_URL}/api/monitoring/force-end/${callId}`);
      fetchActiveCalls();
    } catch (err) {
      console.error("Failed to terminate call", err);
    }
  }
};

const watchStream = async (callId: string) => {
  watchingCallId.value = callId;
  await nextTick();
  
  const appId = Number(import.meta.env.VITE_ZEGO_APP_ID) || 1106955329;
  const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "f6cb4ea31440995b9b6b724678ff112db1d0220cf0dd31a4057c835faae45bd2";
  
  const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
    appId,
    serverSecret,
    callId,
    'admin_' + Math.floor(Math.random() * 1000),
    'Admin_Monitor'
  );

  zp = ZegoUIKitPrebuilt.create(kitToken);
  zp.joinRoom({
    container: document.querySelector("#video-container"),
    scenario: {
      mode: ZegoUIKitPrebuilt.VideoConference,
    },
    showPreJoinView: false,
    showRoomTimer: true,
    showUserList: true,
    showMyCameraToggleButton: false,
    showMyMicrophoneToggleButton: false,
    showAudioVideoSettingsButton: false,
    showScreenShareButton: false,
    turnOnCameraWhenJoining: false,
    turnOnMicrophoneWhenJoining: false,
  });
};

const stopWatching = () => {
  if (zp) {
    zp.destroy();
    zp = null;
  }
  watchingCallId.value = null;
};

onMounted(() => {
  fetchActiveCalls();
  socket = io(API_BASE_URL);
  socket.on('callStartedAlert', () => fetchActiveCalls());
  socket.on('callForceEnded', () => fetchActiveCalls());
});

onUnmounted(() => {
  if (socket) socket.disconnect();
  if (zp) zp.destroy();
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

      <!-- Video Monitoring Container (Hidden when not watching) -->
      <v-expand-transition>
        <v-card v-if="watchingCallId" class="mb-6 bg-black pa-0 overflow-hidden" elevation="4">
          <v-toolbar density="compact" color="grey-darken-4" dark>
            <v-toolbar-title class="text-subtitle-2">Monitoring Call ID: {{ watchingCallId }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" @click="stopWatching"></v-btn>
          </v-toolbar>
          <div id="video-container" style="width: 100%; height: 500px;"></div>
        </v-card>
      </v-expand-transition>

      <v-row>
        <v-col cols="12" sm="6" md="4" lg="3" v-for="call in activeCalls" :key="call._id">
          <v-card class="overflow-hidden border-sm" elevation="1">
            <div style="aspect-ratio: 9/16; background: #000; position: relative;" class="d-flex align-center justify-center">
               <div class="text-center">
                 <v-icon size="48" color="success" class="mb-2">mdi-access-point</v-icon>
                 <div class="text-caption text-success font-weight-bold">STREAM ACTIVE</div>
                 <div class="text-caption text-grey">Host: {{ call.hostId?.name || 'Loading...' }}</div>
               </div>
               <div style="position: absolute; top: 10px; left: 10px;">
                 <v-chip color="error" size="x-small" variant="flat">LIVE</v-chip>
               </div>
               <div style="position: absolute; bottom: 10px; left: 10px; color: white; width: 90%;">
                 <div class="text-caption font-weight-bold text-truncate">{{ call.hostId?.name || 'Host' }}</div>
                 <div class="text-caption text-truncate" style="font-size: 10px !important;">User: {{ call.userId?.name || 'User' }}</div>
               </div>
            </div>
            <v-card-actions class="bg-surface pa-2">
              <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-eye" @click="watchStream(call.callId)">Watch</v-btn>
              <v-spacer></v-spacer>
              <v-btn color="error" variant="flat" size="small" @click="terminateCall(call.callId)">Kill</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" v-if="activeCalls.length === 0">
           <v-alert type="info" variant="tonal" border="start" icon="mdi-video-off">No active video calls right now.</v-alert>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
