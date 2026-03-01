<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Banner Management' });
const banners = ref<any[]>([]);
const newTitle = ref('');

const fetchBanners = async () => {
  const res = await axios.get('https://kairo-novh.onrender.com/api/banners');
  banners.value = res.data;
};

const addBanner = async () => {
  if(!newTitle.value) return;
  await axios.post('https://kairo-novh.onrender.com/api/banners', { title: newTitle.value, status: 'Active' });
  newTitle.value = '';
  fetchBanners();
};

const toggleBanner = async (banner: any) => {
  await axios.put(`https://kairo-novh.onrender.com/api/banners/${banner.id}`, { status: banner.status === 'Active' ? 'Inactive' : 'Active' });
  fetchBanners();
};

const deleteBanner = async (id: number) => {
  await axios.delete(`https://kairo-novh.onrender.com/api/banners/${id}`);
  fetchBanners();
};

onMounted(fetchBanners);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="App Home Banners">
        <div class="d-flex mb-6">
          <v-text-field v-model="newTitle" label="New Banner Title" variant="outlined" hide-details class="mr-2"></v-text-field>
          <v-btn color="primary" height="56" @click="addBanner">Add Banner</v-btn>
        </div>
        <v-row>
          <v-col cols="12" md="4" v-for="banner in banners" :key="banner.id">
            <v-card variant="outlined" class="pa-4">
              <v-img src="https://via.placeholder.com/400x200" height="120" class="mb-4 rounded"></v-img>
              <h3 class="text-h6 mb-2">{{ banner.title }}</h3>
              <div class="d-flex align-center justify-space-between">
                <v-chip :color="banner.status === 'Active' ? 'success' : 'grey'" size="small" @click="toggleBanner(banner)">{{ banner.status }}</v-chip>
                <v-btn icon color="error" variant="text" @click="deleteBanner(banner.id)"><v-icon>mdi-delete</v-icon></v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
