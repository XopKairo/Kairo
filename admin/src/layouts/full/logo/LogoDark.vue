<template>
  <div class="logo">
    <RouterLink to="/" class="text-decoration-none d-flex align-center">
      <img src="@/assets/images/logos/zora-logo.png" alt="Zora" width="40" height="40" class="mr-2 rounded-lg" />
      <h2 class="text-h2 font-weight-bold text-primary">Zora</h2>
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
<style scoped>
.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
