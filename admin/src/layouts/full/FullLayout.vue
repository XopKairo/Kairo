<script setup lang="ts">
import { RouterView } from 'vue-router';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import FooterPanel from './footer/FooterPanel.vue';
import { useCustomizerStore } from '../../stores/customizer';
import { SettingsIcon } from 'vue-tabler-icons';

const customizer = useCustomizerStore();
</script>

<template>
  <v-locale-provider>
    <v-app theme="PurpleTheme" :class="[customizer.fontTheme]">
      <VerticalSidebarVue />
      <VerticalHeaderVue />

      <v-main>
        <v-container fluid class="page-wrapper">
          <RouterView />
        </v-container>
        <v-container fluid class="pt-0">
          <FooterPanel />
        </v-container>
      </v-main>
    </v-app>
  </v-locale-provider>
</template>
