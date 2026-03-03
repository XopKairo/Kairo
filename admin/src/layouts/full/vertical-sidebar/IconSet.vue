<script setup>
const props = defineProps({ item: [Object, String], level: Number });
</script>

<template>
  <template v-if="typeof props.item === 'string'">
    <v-icon :size="props.level > 0 ? '18' : '22'">{{ props.item }}</v-icon>
  </template>
  <template v-else-if="props.level > 0">
    <component :is="props.item" size="18" fill="currentColor" stroke-width="1.5" class="iconClass"></component>
  </template>
  <template v-else>
    <component :is="props.item" size="22" stroke-width="1.5" class="iconClass"></component>
  </template>
</template>
