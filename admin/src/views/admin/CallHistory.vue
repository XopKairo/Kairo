<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Video Call Logs' });
const calls = ref<any[]>([]);

const fetchCalls = async () => {
  const res = await axios.get('https://kairo-b1i9.onrender.com/api/calls');
  calls.value = res.data;
};

onMounted(fetchCalls);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Recent Calls">
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Host</th>
              <th>Duration</th>
              <th>Cost (Coins)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="call in calls" :key="call.id">
              <td>{{ call.id }}</td>
              <td>{{ call.user }}</td>
              <td>{{ call.host }}</td>
              <td>{{ call.duration }}</td>
              <td class="text-error font-weight-bold">{{ call.cost }}</td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
