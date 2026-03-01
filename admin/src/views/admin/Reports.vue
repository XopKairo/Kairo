<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Reports & Bans' });
const reports = ref<any[]>([]);

const fetchReports = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/reports');
  reports.value = res.data;
};

const resolveReport = async (id: number) => {
  await axios.put(`https://kairo-novh.onrender.com/api/reports/${id}`, { status: 'Resolved' });
  fetchReports();
};

const banUserFromReport = async (userId: number) => {
  if (confirm("Are you sure you want to ban this user based on this report?")) {
    await axios.put(`https://kairo-novh.onrender.com/api/users/${userId}`, { status: 'Banned' });
    fetchReports(); // Refresh reports
    alert("User has been banned.");
  }
};

onMounted(fetchReports);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="User Reports">
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Reporter ID</th>
              <th>Reported ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td>#{{ report.id }}</td>
              <td>{{ report.reporterId }}</td>
              <td>{{ report.reportedId }}</td>
              <td>{{ report.reason }}</td>
              <td><v-chip size="x-small" :color="report.status === 'Resolved' ? 'success' : 'warning'">{{ report.status }}</v-chip></td>
              <td>
                <v-btn size="x-small" color="primary" @click="resolveReport(report.id)" v-if="report.status !== 'Resolved'">Resolve</v-btn>
                <v-btn size="x-small" color="error" @click="banUserFromReport(report.reportedId)" class="ml-2">Ban User</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
