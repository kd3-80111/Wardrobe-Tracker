<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useWardrobeStore } from './stores/wardrobe'
import { theme, toggleTheme } from './composables/theme'
import { registerSW } from 'virtual:pwa-register'

const route = useRoute()
const store = useWardrobeStore()
const online = ref(navigator.onLine)
const updateReady = ref(false)
const updateSW = registerSW({
  onNeedRefresh: () => { updateReady.value = true },
  onOfflineReady: () => store.notify('Ready to use offline'),
})

const navigation = [
  ['/wardrobe', '▦', 'Wardrobe'],
  ['/clothing/add', '+', 'Add item'],
  ['/home', '⌂', 'Home'],
]

onMounted(() => {
  store.load().catch(() => {})
  window.addEventListener('online', () => { online.value = true })
  window.addEventListener('offline', () => { online.value = false })
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="brand" to="/wardrobe" aria-label="My Wardrobe">
        <span class="brand-mark">◈</span><span>My Wardrobe</span>
      </RouterLink>
      <div class="header-actions"><RouterLink to="/categories">Organize</RouterLink><RouterLink to="/settings">Settings</RouterLink><button class="icon-button" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">{{ theme === 'dark' ? '☀' : '☾' }}</button></div>
    </header>
    <div v-if="!online" class="status-banner">Offline · changes are saved on this device</div>
    <div v-if="updateReady" class="status-banner update-banner">An update is ready. <button @click="updateSW(true)">Update now</button></div>
    <main class="page-container">
      <div v-if="store.error" class="alert alert-danger" role="alert">{{ store.error }}</div>
      <RouterView :key="route.fullPath" />
    </main>
    <nav class="bottom-nav" aria-label="Primary navigation">
      <RouterLink v-for="[path, icon, label] in navigation" :key="path" :to="path"
        :class="{ active: route.path === path || (path === '/wardrobe' && route.path.startsWith('/clothing/') && route.name !== 'add') }" :aria-current="route.path === path ? 'page' : undefined">
        <span aria-hidden="true">{{ icon }}</span>{{ label }}
      </RouterLink>
    </nav>
    <button v-if="store.toast" class="toast" role="status" @click="store.toast = ''">{{ store.toast }}</button>
  </div>
</template>
