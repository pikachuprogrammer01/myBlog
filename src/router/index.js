import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/article/:id',
    name: 'Article',
    component: () => import('@/views/Article.vue'),
    props: true
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/Tools.vue')
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/Projects.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/Contact.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bookmarks',
    name: 'Bookmarks',
    component: () => import('@/views/Bookmarks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/Tags.vue')
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/views/Categories.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/views/Archive.vue')
  },
  {
    path: '/interview',
    name: 'Interview',
    component: () => import('@/views/Interview.vue')
  },
  {
    path: '/interview/:category',
    name: 'InterviewCategory',
    component: () => import('@/views/InterviewCategory.vue'),
    props: true
  },
  {
    path: '/interview/:category/:id',
    name: 'InterviewQuestion',
    component: () => import('@/views/InterviewQuestion.vue'),
    props: true
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()

  // 仅对需要认证的路由验证 session；公开路由直接放行
  if (to.meta.requiresAuth || to.meta.requiresAdmin) {
    if (authStore.token && !authStore.user) {
      await authStore.restoreSession()
    }
    if (!authStore.isAuthenticated) {
      return '/login'
    }
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return '/'
    }
  }

  return true
})

export default router