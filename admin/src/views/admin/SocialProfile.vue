<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Social Profile' });
const breadcrumbs = ref([
  { title: 'Admin', disabled: false, href: '#' },
  { title: 'Profile', disabled: true, href: '#' }
]);

const socialLinks = ref({
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: ''
});

const fetchSocialLinks = async () => {
  try {
    const res = await axios.get('https://kairo-novh.onrender.com/api/admin/social-profile');
    socialLinks.value = { ...socialLinks.value, ...res.data };
  } catch (error) {
    console.error("Error fetching social links:", error);
  }
};

const updateSocialLinks = async () => {
  try {
    await axios.post('https://kairo-novh.onrender.com/api/admin/social-profile', socialLinks.value);
    alert("Social links updated successfully!");
  } catch (error) {
    console.error("Error updating social links:", error);
    alert("Failed to update social links.");
  }
};

onMounted(fetchSocialLinks);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <UiParentCard title="Your Social Presence">
        <v-text-field v-model="socialLinks.facebook" label="Facebook Profile URL" prepend-inner-icon="mdi-facebook" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="socialLinks.twitter" label="Twitter Profile URL" prepend-inner-icon="mdi-twitter" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="socialLinks.instagram" label="Instagram Profile URL" prepend-inner-icon="mdi-instagram" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="socialLinks.linkedin" label="LinkedIn Profile URL" prepend-inner-icon="mdi-linkedin" variant="outlined" class="mb-4"></v-text-field>
        <v-btn color="primary" block @click="updateSocialLinks">Save Social Links</v-btn>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
