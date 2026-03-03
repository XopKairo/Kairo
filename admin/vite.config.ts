import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL || 'https://kairo-b1i9.onrender.com'),
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://kairo-b1i9.onrender.com/api')
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => ['v-list-recognize-title'].includes(tag)
        }
      }
    }),
    vuetify({
      autoImport: true
    })
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {}
    }
  },
  build: {
    chunkSizeWarningLimit: 1024 * 1024 // Set the limit to 1 MB
  },
  optimizeDeps: {
    exclude: ['vuetify'],
    entries: ['./src/**/*.vue']
  }
});
