<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Banner Management' });
const banners = ref<any[]>([]);
const newTitle = ref('');
const newLink = ref('');
const fileInput = ref<File | null>(null);

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const fetchBanners = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/marketing`);
    banners.value = res.data;
  } catch (err) {
    console.error("Failed to fetch banners", err);
  }
};

const handleFileChange = (e: any) => {
  fileInput.value = e.target.files[0];
};

const addBanner = async () => {
  if (!newTitle.value || !fileInput.value) {
    alert("Title and Image are required.");
    return;
  }
  
  const formData = new FormData();
  formData.append('title', newTitle.value);
  formData.append('linkUrl', newLink.value);
  formData.append('banner', fileInput.value);

  try {
    await axios.post(`${API_BASE_URL}/api/marketing`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    newTitle.value = '';
    newLink.value = '';
    fileInput.value = null;
    fetchBanners();
  } catch (err) {
    console.error("Failed to add banner", err);
  }
};

const toggleBanner = async (banner: any) => {
  try {
    await axios.put(`${API_BASE_URL}/api/marketing/${banner._id}`, { 
      status: banner.status === 'Active' ? 'Inactive' : 'Active' 
    });
    fetchBanners();
  } catch (err) {
    console.error("Failed to toggle banner", err);
  }
};

const deleteBanner = async (id: string) => {
  if (!confirm("Delete this banner?")) return;
  try {
    await axios.delete(`${API_BASE_URL}/api/marketing/${id}`);
    fetchBanners();
  } catch (err) {
    console.error("Failed to delete banner", err);
  }
};

const getImageUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}/${url}`;
};

onMounted(fetchBanners);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="[]"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="App Home Banners">
        <v-card variant="tonal" class="pa-4 mb-6 bg-grey-lighten-4">
           <h4 class="text-subtitle-1 mb-4 font-weight-bold">Upload New Banner</h4>
           <v-row>
             <v-col cols="12" md="4">
               <v-text-field v-model="newTitle" label="Banner Title" variant="outlined" hide-details density="compact"></v-text-field>
             </v-col>
             <v-col cols="12" md="4">
               <v-text-field v-model="newLink" label="Target Link (Optional)" variant="outlined" hide-details density="compact"></v-text-field>
             </v-col>
             <v-col cols="12" md="4">
               <input type="file" @change="handleFileChange" class="mt-1" accept="image/*" />
             </v-col>
             <v-col cols="12">
               <v-btn color="primary" @click="addBanner" block prepend-icon="mdi-upload">Add Real Banner</v-btn>
             </v-col>
           </v-row>
        </v-card>

        <v-row>
          <v-col cols="12" md="4" v-for="banner in banners" :key="banner._id">
            <v-card variant="outlined" class="pa-0 overflow-hidden">
              <v-img :src="getImageUrl(banner.imageUrl)" height="160" cover class="bg-black"></v-img>
              <div class="pa-4">
                <h3 class="text-subtitle-1 mb-2 font-weight-bold text-truncate">{{ banner.title }}</h3>
                <div class="d-flex align-center justify-space-between">
                  <v-chip :color="banner.status === 'Active' ? 'success' : 'grey'" size="small" @click="toggleBanner(banner)" label>
                    {{ banner.status }}
                  </v-chip>
                  <v-btn icon color="error" variant="text" size="small" @click="deleteBanner(banner._id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" v-if="banners.length === 0" class="text-center py-8">
             <v-icon size="64" color="grey-lighten-1">mdi-image-off</v-icon>
             <div class="text-h6 text-grey-lighten-1 mt-2">No active banners found in database.</div>
          </v-col>
        </v-row>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
