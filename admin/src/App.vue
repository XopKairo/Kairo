<template>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { io } from 'socket.io-client';

onMounted(() => {
  const socket = io('https://kairo-novh.onrender.com');
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket.id);
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
</script>
