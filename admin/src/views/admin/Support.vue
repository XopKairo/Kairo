<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Support Tickets' });
const tickets = ref<any[]>([]);

const fetchTickets = async () => {
  const res = await axios.get('https://kairo-b1i9.onrender.com/api/tickets');
  tickets.value = res.data;
};

const resolveTicket = async (id: number) => {
  await axios.put(`https://kairo-b1i9.onrender.com/api/tickets/${id}`, { status: 'Resolved' });
  fetchTickets();
};

onMounted(fetchTickets);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Open Tickets">
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tickets" :key="t.id">
              <td>#{{ t.id }}</td>
              <td>{{ t.user }}</td>
              <td>{{ t.subject }}</td>
              <td><v-chip size="x-small" :color="t.status === 'Open' ? 'error' : 'success'">{{ t.status }}</v-chip></td>
              <td>
                <v-btn color="primary" size="x-small" @click="resolveTicket(t.id)" v-if="t.status === 'Open'">Mark Resolved</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
