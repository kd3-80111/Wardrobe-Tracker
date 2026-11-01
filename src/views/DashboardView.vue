<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import ClothingCard from '../components/ClothingCard.vue'

const store = useWardrobeStore()
const router = useRouter()
const stats = computed(() => ({
  items: store.clothes.length,
  categories: store.categories.length,
  favourites: store.clothes.filter((item) => item.preference === 'love').length,
  rehome: store.clothes.filter((item) => item.markedForDisposal).length,
}))
const recent = computed(() => [...store.clothes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3))
async function remove(item) {
  if (window.confirm(`Delete “${item.name}” permanently?`)) await store.deleteClothing(item.id)
}
</script>

<template>
  <section class="page-heading">
    <div><p class="eyebrow">Overview</p><h1>Your wardrobe</h1><p>Everything you need, without the clutter.</p></div>
    <RouterLink class="button primary" to="/clothing/add">+ Add item</RouterLink>
  </section>

  <div v-if="store.loading && !store.initialized" class="loading-card">Loading your wardrobe…</div>
  <template v-else>
    <section class="stat-grid" aria-label="Wardrobe summary">
      <RouterLink to="/wardrobe"><strong>{{ stats.items }}</strong><span>Items</span></RouterLink>
      <RouterLink to="/categories"><strong>{{ stats.categories }}</strong><span>Categories</span></RouterLink>
      <RouterLink to="/wardrobe?preference=love"><strong>{{ stats.favourites }}</strong><span>Favourites</span></RouterLink>
      <RouterLink to="/wardrobe?disposal=yes"><strong>{{ stats.rehome }}</strong><span>To rehome</span></RouterLink>
    </section>

    <section class="section-block">
      <div class="section-heading"><h2>Recently updated</h2><RouterLink to="/wardrobe">View all</RouterLink></div>
      <div v-if="recent.length" class="card-list compact-list">
        <ClothingCard v-for="item in recent" :key="item.id" :item="item" :categories="store.categoriesFor(item)" :usage="store.usageById(item.usageStatus)"
          @view="router.push(`/clothing/${item.id}`)" @edit="router.push(`/clothing/${item.id}/edit`)"
          @delete="remove(item)" @preference="store.setPreference(item.id,$event)" />
      </div>
      <div v-else class="empty-state"><h2>Your wardrobe is empty</h2><p>Add your first item to get started.</p><RouterLink class="button primary" to="/clothing/add">Add item</RouterLink></div>
    </section>
  </template>
</template>
