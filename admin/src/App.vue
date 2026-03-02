<template>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

onMounted(() => {
  socket = io(import.meta.env.VITE_BASE_URL);
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket?.id);
  });

  socket.on('payoutAlert', (data) => {
    alert(`Live Payout Request: ${data.amount} INR from User ID: ${data.userId}`);
  });

  socket.on('supportAlert', (data) => {
    alert(`New Support Ticket: ${data.reason}`);
  });

  socket.on('callStartedAlert', (data) => {
    console.log('Live Call Started:', data);
  });
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>
