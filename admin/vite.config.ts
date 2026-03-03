import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL || 'https://kairo-b1i9.onrender.com'),
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://kairo-b1i9.onrender.com/api'),
    'import.meta.env.VITE_ZEGO_APP_ID': JSON.stringify(process.env.VITE_ZEGO_APP_ID || '1106955329'),
    'import.meta.env.VITE_ZEGO_SERVER_SECRET': JSON.stringify(process.env.VITE_ZEGO_SERVER_SECRET || 'f6cb4ea31440995b9b6b724678ff112db1d0220cf0dd31a4057c835faae45bd2')
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
