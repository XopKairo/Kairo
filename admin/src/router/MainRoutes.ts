const MainRoutes = {
  path: '/',
  meta: {
    requiresAuth: false
  },
  redirect: '/dashboard/default',
  component: () => import('@/layouts/full/FullLayout.vue'),
  children: [
    {
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'MasterDashboard',
      path: '/admin/master-dashboard',
      component: () => import('@/views/admin/MasterDashboard.vue')
    },
    {
      name: 'UserList',
      path: '/admin/users/list',
      component: () => import('@/views/admin/UserList.vue')
    },
    {
      name: 'HostList',
      path: '/admin/hosts/list',
      component: () => import('@/views/admin/HostList.vue')
    },
    {
      name: 'CallHistory',
      path: '/admin/calls/history',
      component: () => import('@/views/admin/CallHistory.vue')
    },
    {
      name: 'HostVerify',
      path: '/admin/hosts/verify',
      component: () => import('@/views/admin/HostVerify.vue')
    },
    {
      name: 'VerificationRequests',
      path: '/admin/verification-requests',
      component: () => import('@/views/admin/VerificationRequests.vue')
    },
    {
      name: 'InterestSettings',
      path: '/admin/interests',
      component: () => import('@/views/admin/InterestSettings.vue')
    },
    {
      name: 'ReportedChats',
      path: '/admin/reported-chats',
      component: () => import('@/views/admin/ReportedChats.vue')
    },
    {
      name: 'FeaturedPosts',
      path: '/admin/featured-posts',
      component: () => import('@/views/admin/FeaturedPosts.vue')
    },
    {
      name: 'UserRewards',
      path: '/admin/user-rewards',
      component: () => import('@/views/admin/UserRewards.vue')
    },
    {
      name: 'Gifts',
      path: '/admin/gifts',
      component: () => import('@/views/admin/GiftManagement.vue')
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      component: () => import('@/views/admin/AppSettings.vue')
    },
    {
      name: 'CoinPackages',
      path: '/admin/economy/packages',
      component: () => import('@/views/admin/CoinPackages.vue')
    },
    {
      name: 'BonusSettings',
      path: '/admin/economy/bonus',
      component: () => import('@/views/admin/BonusSettings.vue')
    },
    {
      name: 'Notifications',
      path: '/admin/marketing/notifications',
      component: () => import('@/views/admin/PushNotifications.vue')
    },
    {
      name: 'Agencies',
      path: '/admin/agencies',
      component: () => import('@/views/admin/AgencyManagement.vue')
    },
    {
      name: 'Monitoring',
      path: '/admin/monitoring',
      component: () => import('@/views/admin/LiveMonitoring.vue')
    },
    {
      name: 'AdSettings',
      path: '/admin/ads',
      component: () => import('@/views/admin/AdSettings.vue')
    },
    {
      name: 'Banners',
      path: '/admin/banners',
      component: () => import('@/views/admin/Banners.vue')
    },
    {
      name: 'Support',
      path: '/admin/support',
      component: () => import('@/views/admin/Support.vue')
    },
    {
      name: 'HostPayouts',
      path: '/admin/hosts/payouts',
      component: () => import('@/views/admin/HostPayouts.vue')
    },
    {
      name: 'Reports',
      path: '/admin/reports',
      component: () => import('@/views/admin/Reports.vue')
    },
    {
      name: 'AccountSettings',
      path: '/admin/account/settings',
      component: () => import('@/views/admin/AccountSettings.vue')
    },
    {
      name: 'SocialProfile',
      path: '/admin/social-profile',
      component: () => import('@/views/admin/SocialProfile.vue')
    }
  ]
};

export default MainRoutes;
