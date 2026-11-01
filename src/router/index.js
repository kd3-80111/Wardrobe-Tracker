import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/DashboardView.vue'), meta: { title: 'Home' } },
  { path: '/wardrobe', name: 'wardrobe', component: () => import('../views/WardrobeView.vue'), meta: { title: 'Wardrobe' } },
  { path: '/clothing/add', name: 'add', component: () => import('../views/ClothingFormView.vue'), meta: { title: 'Add item' } },
  { path: '/clothing/:id', name: 'details', component: () => import('../views/ClothingDetailsView.vue'), meta: { title: 'Item details' } },
  { path: '/clothing/:id/edit', name: 'edit', component: () => import('../views/ClothingFormView.vue'), meta: { title: 'Edit item' } },
  { path: '/categories', name: 'categories', component: () => import('../views/CategoriesView.vue'), meta: { title: 'Organize' } },
  { path: '/usages', redirect: { path: '/categories', query: { tab: 'usages' } } },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { title: 'Settings' } },
  { path: '/disposal', redirect: { path: '/wardrobe', query: { disposal: 'yes' } } },
  { path: '/analytics', redirect: '/' },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Not found' } },
]

const router = createRouter({ history: createWebHashHistory(import.meta.env.BASE_URL), routes, scrollBehavior: () => ({ top: 0 }) })
router.afterEach((to) => { document.title = `${to.meta.title || 'My Wardrobe'} | My Wardrobe` })
export default router
