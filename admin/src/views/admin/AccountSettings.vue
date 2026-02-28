<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Account Settings' });
const breadcrumbs = ref([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Settings', disabled: true, href: '#' }
]);

const accountDetails = ref({
  name: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const fetchAdminDetails = async () => {
  try {
    const res = await axios.get('https://kairo-novh.onrender.com/api/admin/profile');
    accountDetails.value.name = res.data.name;
    accountDetails.value.email = res.data.email;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
  }
};

const updateAccount = async () => {
  try {
    const payload: any = { name: accountDetails.value.name, email: accountDetails.value.email };
    if (accountDetails.value.newPassword && accountDetails.value.newPassword === accountDetails.value.confirmPassword) {
      // For a real app, you'd send currentPassword for verification
      payload.newPassword = accountDetails.value.newPassword;
    } else if (accountDetails.value.newPassword) {
      alert("New passwords do not match!");
      return;
    }
    
    await axios.post('https://kairo-novh.onrender.com/api/admin/account/update', payload);
    alert("Account updated successfully!");
    // Clear password fields
    accountDetails.value.currentPassword = '';
    accountDetails.value.newPassword = '';
    accountDetails.value.confirmPassword = '';
  } catch (error) {
    console.error("Error updating account:", error);
    alert("Failed to update account.");
  }
};

onMounted(fetchAdminDetails);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <UiParentCard title="Personal Details">
        <v-text-field v-model="accountDetails.name" label="Full Name" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="accountDetails.email" label="Email Address" variant="outlined" disabled class="mb-4"></v-text-field>
        <v-btn color="primary" block @click="updateAccount">Update Profile</v-btn>
      </UiParentCard>
    </v-col>
    <v-col cols="12" md="6">
      <UiParentCard title="Change Password">
        <v-text-field v-model="accountDetails.currentPassword" label="Current Password" type="password" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="accountDetails.newPassword" label="New Password" type="password" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="accountDetails.confirmPassword" label="Confirm New Password" type="password" variant="outlined" class="mb-4"></v-text-field>
        <v-btn color="secondary" block @click="updateAccount">Change Password</v-btn>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
