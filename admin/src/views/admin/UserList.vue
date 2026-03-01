<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'User Management' });
const users = ref<any[]>([]);

const fetchUsers = async () => {
  try {
    const response = await axios.get('https://kairo-b1i9.onrender.com/api/users');
    users.value = response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

const banUser = async (id: string | number) => {
  if(confirm("Are you sure you want to ban this user?")) {
    try {
      await axios.post(`https://kairo-b1i9.onrender.com/api/users/${id}/ban`, { isBanned: true });
      fetchUsers();
    } catch (error) {
      console.error("Error banning user:", error);
    }
  }
};

const updateCoins = async (id: number, currentCoins: number) => {
  const newCoins = prompt("Enter new coin balance:", currentCoins.toString());
  if (newCoins !== null) {
    await axios.put(`https://kairo-b1i9.onrender.com/api/users/${id}`, { coins: parseInt(newCoins) });
    fetchUsers();
  }
};

onMounted(fetchUsers);

const breadcrumbs = shallowRef([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Users', disabled: true, href: '#' }
]);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="All Users">
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User Details</th>
              <th>Coins</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td>{{ user._id }}</td>
              <td>
                <div class="font-weight-bold">{{ user.name }}</div>
                <div class="text-caption">{{ user.email }}</div>
              </td>
              <td>
                <v-chip color="amber-darken-3" size="small" @click="updateCoins(user._id, user.coins)">
                  <v-icon size="small" class="mr-1">mdi-database-outline</v-icon>
                  {{ user.coins }}
                </v-chip>
              </td>
              <td>
                <v-chip :color="user.isBanned ? 'error' : 'success'" size="small">
                  {{ user.isBanned ? 'Banned' : 'Active' }}
                </v-chip>
              </td>
              <td>
                <v-btn icon color="error" variant="text" size="small" @click="banUser(user._id)" v-if="!user.isBanned">
                  <v-icon>mdi-account-cancel</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
