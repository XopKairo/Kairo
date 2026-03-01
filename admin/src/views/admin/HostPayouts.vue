<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Host Payout Management' });
const payouts = ref<any[]>([]);

const fetchPayouts = async () => {
  try {
    const res = await axios.get('https://kairo-novh.onrender.com/api/payouts');
    payouts.value = res.data;
  } catch (error) {
    console.error("Error fetching payouts:", error);
  }
};

const updateStatus = async (id: string, status: string) => {
  try {
    // Backend model status: ['Pending', 'Approved', 'Rejected']
    await axios.put(`https://kairo-novh.onrender.com/api/payouts/${id}`, { status });
    fetchPayouts();
  } catch (error) {
    console.error("Error updating payout status:", error);
  }
};

onMounted(fetchPayouts);

const breadcrumbs = shallowRef([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Payouts', disabled: true, href: '#' }
]);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Withdrawal Requests">
        <v-table density="comfortable" class="border-opacity-25" rounded="lg">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th class="text-left font-weight-bold">Host / ID</th>
              <th class="text-left font-weight-bold">Amount</th>
              <th class="text-left font-weight-bold">Status</th>
              <th class="text-left font-weight-bold">Payment Details</th>
              <th class="text-left font-weight-bold">Date</th>
              <th class="text-left font-weight-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payout in payouts" :key="payout._id" class="hover-row">
              <td class="py-4">
                <div class="font-weight-bold">{{ payout.host?.name || 'N/A' }}</div>
                <div class="text-caption text-medium-emphasis">ID: {{ payout._id }}</div>
              </td>
              <td class="text-success font-weight-bold text-subtitle-1">₹{{ payout.amountINR?.toLocaleString('en-IN') }}</td>
              <td>
                <v-chip 
                  :color="payout.status === 'Pending' ? 'warning' : (payout.status === 'Approved' ? 'success' : 'error')" 
                  size="small"
                  variant="flat"
                  rounded="md"
                >
                  {{ payout.status }}
                </v-chip>
              </td>
              <td>
                 <v-tooltip location="bottom" :text="payout.paymentDetails">
                    <template v-slot:activator="{ props }">
                      <v-btn icon="mdi-information-outline" size="x-small" variant="text" v-bind="props"></v-btn>
                    </template>
                 </v-tooltip>
                 <span class="text-caption text-truncate d-inline-block" style="max-width: 100px;">{{ payout.paymentDetails }}</span>
              </td>
              <td>{{ new Date(payout.createdAt).toLocaleDateString() }}</td>
              <td>
                <div class="d-flex gap-2" v-if="payout.status === 'Pending'">
                  <v-btn color="success" size="small" variant="flat" @click="updateStatus(payout._id, 'Approved')">Approve</v-btn>
                  <v-btn color="error" size="small" variant="tonal" @click="updateStatus(payout._id, 'Rejected')">Reject</v-btn>
                </div>
                <span v-else class="text-caption font-weight-medium">Processed</span>
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-alert v-if="!payouts.length" type="info" variant="tonal" class="mt-4">No payout requests found.</v-alert>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.hover-row:hover {
  background-color: #fcfcfc;
}
.gap-2 {
  gap: 8px;
}
</style>
