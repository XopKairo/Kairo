<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h4 mb-4">Featured Posts (Stories)</h2>
        <p class="text-subtitle-1 text-grey mb-6">Pin important posts to the top of all users' feeds. Posts automatically disappear after 24 hours.</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Author</th>
                <th class="text-left">Media</th>
                <th class="text-left">Caption</th>
                <th class="text-left">Posted At</th>
                <th class="text-left">Expires In</th>
                <th class="text-left">Status</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in posts" :key="post._id">
                <td>{{ post.userId?.name || post.userId?.email || 'Unknown' }}</td>
                <td>
                  <v-img v-if="post.mediaUrl" :src="post.mediaUrl" width="50" height="50" cover class="bg-grey-lighten-2 rounded"></v-img>
                  <span v-else class="text-grey text-caption">No media</span>
                </td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ post.caption }}
                </td>
                <td>{{ new Date(post.createdAt).toLocaleString() }}</td>
                <td>
                  <v-chip size="small" color="info" variant="flat">
                    {{ calculateHoursLeft(post.expiresAt) }}
                  </v-chip>
                </td>
                <td>
                  <v-chip :color="post.isFeatured ? 'warning' : 'grey'" size="small">
                    <v-icon start icon="mdi-star" v-if="post.isFeatured"></v-icon>
                    {{ post.isFeatured ? 'Featured' : 'Standard' }}
                  </v-chip>
                </td>
                <td>
                  <v-btn
                    size="small"
                    :color="post.isFeatured ? 'grey' : 'warning'"
                    :prepend-icon="post.isFeatured ? 'mdi-star-off' : 'mdi-star'"
                    @click="toggleFeature(post)"
                  >
                    {{ post.isFeatured ? 'Unpin' : 'Pin to Top' }}
                  </v-btn>
                </td>
              </tr>
              <tr v-if="posts.length === 0 && !loading">
                <td colspan="7" class="text-center py-4">No active posts available.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4"><v-progress-circular indeterminate color="primary"></v-progress-circular></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'https://kairo-novh.onrender.com';

const posts = ref<any[]>([]);
const loading = ref(true);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const calculateHoursLeft = (expiresAt: string) => {
  const now = new Date().getTime();
  const exp = new Date(expiresAt).getTime();
  const diffHours = (exp - now) / (1000 * 60 * 60);
  
  if (diffHours <= 0) return 'Expired';
  if (diffHours < 1) return '< 1 hr left';
  return `${Math.floor(diffHours)} hrs left`;
};

const fetchPosts = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/posts/admin`);
    posts.value = response.data || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
  } finally {
    loading.value = false;
  }
};

const toggleFeature = async (post: any) => {
  const newStatus = !post.isFeatured;
  try {
    await axios.put(`${API_BASE_URL}/api/posts/${post._id}/feature`, { isFeatured: newStatus });
    post.isFeatured = newStatus;
    showSnackbar(newStatus ? 'Post pinned to top' : 'Post unpinned');
  } catch (error) {
    console.error('Error updating feature status:', error);
    showSnackbar('Failed to update status', 'error');
  }
};

onMounted(() => {
  fetchPosts();
});
</script>
