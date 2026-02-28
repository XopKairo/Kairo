import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import PublicRoutes from './PublicRoutes';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    MainRoutes,
    PublicRoutes
  ]
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();
  const publicPages = ['/login1', '/login', '/register'];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !auth.user) {
    return next('/login1');
  }
  
  next();
});
