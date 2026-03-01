<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Host Management' });
const hosts = ref<any[]>([]);

const fetchHosts = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/hosts');
  hosts.value = res.data;
};

onMounted(fetchHosts);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Active Hosts">
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Earnings ($)</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="host in hosts" :key="host.id">
              <td>{{ host.id }}</td>
              <td>{{ host.name }}</td>
              <td><v-chip size="x-small" :color="host.status === 'Online' ? 'success' : 'grey'">{{ host.status }}</v-chip></td>
              <td>{{ host.earnings }}</td>
              <td>{{ host.rating }} ★</td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
