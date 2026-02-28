<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Host Payout Management' });
const payouts = ref<any[]>([]);

const fetchPayouts = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/payouts');
  payouts.value = res.data;
};

const updateStatus = async (id: number, status: string) => {
  await axios.put(`https://kairo-novh.onrender.com/api/payouts/${id}`, { status });
  fetchPayouts();
};

onMounted(fetchPayouts);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Withdrawal Requests">
        <v-table>
          <thead>
            <tr>
              <th>Host ID</th>
              <th>Amount ($)</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payout in payouts" :key="payout.id">
              <td>{{ payout.host_id }}</td>
              <td class="text-success font-weight-bold">${{ payout.amount }}</td>
              <td>
                <v-chip :color="payout.status === 'Pending' ? 'warning' : 'success'" size="x-small">{{ payout.status }}</v-chip>
              </td>
              <td>{{ new Date(payout.id).toLocaleDateString() }}</td>
              <td>
                <v-btn color="success" size="x-small" @click="updateStatus(payout.id, 'Completed')" v-if="payout.status === 'Pending'">Approve</v-btn>
                <v-btn color="error" size="x-small" @click="updateStatus(payout.id, 'Rejected')" v-if="payout.status === 'Pending'" class="ml-2">Reject</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
