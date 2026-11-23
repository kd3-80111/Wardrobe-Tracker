<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useWardrobeStore } from './stores/wardrobe'
import { theme, toggleTheme } from './composables/theme'
import { registerSW } from 'virtual:pwa-register'
import AppIcon from './components/AppIcon.vue'

const route = useRoute()
const store = useWardrobeStore()
const online = ref(navigator.onLine)
const updateReady = ref(false)
const updateSW = registerSW({
  onNeedRefresh: () => { updateReady.value = true },
  onOfflineReady: () => store.notify('Ready to use offline'),
})

const navigation = [
  { path: '/home', icon: 'home', label: 'Home' },
  { path: '/wardrobe', icon: 'hanger', label: 'Wardrobe' },
  { path: '/clothing/add', icon: 'plus', label: 'Add', primary: true },
  { path: '/categories', icon: 'layers', label: 'Organize' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]
const isActive = (path) => route.path === path || (path === '/wardrobe' && route.path.startsWith('/clothing/') && route.name !== 'add')

onMounted(() => {
  store.load().catch(() => {})
  // Ask the browser not to evict the wardrobe when storage runs low (matters most on Safari).
  navigator.storage?.persist?.().catch(() => {})
  window.addEventListener('online', () => { online.value = true })
  window.addEventListener('offline', () => { online.value = false })
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="brand" to="/home" aria-label="My Wardrobe home">
        <span class="brand-mark"><AppIcon name="hanger" :size="19" /></span><span>My Wardrobe</span>
      </RouterLink>
      <button class="icon-button" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="19" />
      </button>
    </header>
    <div v-if="!online" class="status-banner">Offline · changes are saved on this device</div>
    <div v-if="updateReady" class="status-banner update-banner">An update is ready. <button @click="updateSW(true)">Update now</button></div>
    <main class="page-container">
      <div v-if="store.error" class="alert alert-danger" role="alert">{{ store.error }}</div>
      <RouterView v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <div :key="route.path" class="page"><component :is="Component" /></div>
        </Transition>
      </RouterView>
    </main>
    <nav class="bottom-nav" aria-label="Primary navigation">
      <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" :class="{ active: isActive(item.path), 'nav-add': item.primary }" :aria-current="isActive(item.path) ? 'page' : undefined">
        <span class="nav-icon"><AppIcon :name="item.icon" :size="item.primary ? 24 : 21" /></span>{{ item.label }}
      </RouterLink>
    </nav>
    <div class="toast-region" role="status" aria-live="polite">
      <Transition name="toast-rise">
        <div v-if="store.toast" class="toast">
          <span class="toast-message">{{ store.toast }}</span>
          <button v-if="store.toastAction" type="button" class="toast-action" @click="store.runToastAction()">{{ store.toastAction }}</button>
          <button type="button" class="toast-close" aria-label="Dismiss" @click="store.dismissToast()"><AppIcon name="x" :size="16" /></button>
        </div>
      </Transition>
    </div>
  </div>
</template>
