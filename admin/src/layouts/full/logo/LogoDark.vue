<template>
  <div class="logo">
    <RouterLink to="/" class="text-decoration-none d-flex align-center">
      <h2 class="text-h2 font-weight-bold text-primary">Kairo</h2>
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
