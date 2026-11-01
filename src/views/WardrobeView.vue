<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { visibleClothes } from '../services'
import ClothingCard from '../components/ClothingCard.vue'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const filters = reactive({ search: '', category: '', preference: '', usage: '', disposal: '', sort: 'updated' })

watch(() => route.query, (query) => {
  filters.preference = query.preference || ''
  filters.usage = query.usage || ''
  filters.disposal = query.disposal || ''
}, { immediate: true })

const items = computed(() => visibleClothes(store.clothes.map((item) => ({
  ...item,
  categoryName: store.categoriesFor(item).map((category) => category.name).join(' '),
})), filters))
const hasFilters = computed(() => filters.search || filters.category || filters.preference || filters.usage || filters.disposal)

function clearFilters() {
  Object.assign(filters, { search: '', category: '', preference: '', usage: '', disposal: '', sort: 'updated' })
  router.replace('/wardrobe')
}
async function remove(item) {
  if (window.confirm(`Delete “${item.name}” permanently?`)) await store.deleteClothing(item.id)
}
</script>

<template>
  <section class="page-heading">
    <div><p class="eyebrow">Inventory</p><h1>Wardrobe</h1><p>{{ items.length }} of {{ store.clothes.length }} items</p></div>
    <RouterLink class="button primary" to="/clothing/add">+ Add item</RouterLink>
  </section>

  <section class="filter-panel" aria-label="Search and filters">
    <label class="search-field"><span aria-hidden="true">⌕</span><input v-model="filters.search" type="search" placeholder="Search items" aria-label="Search wardrobe" /></label>
    <div class="filter-row">
      <select v-model="filters.category" aria-label="Filter by category"><option value="">All categories</option><option v-for="category in store.categories" :key="category.id" :value="category.id">{{ category.name }}</option></select>
      <select v-model="filters.preference" aria-label="Filter by preference"><option value="">Any preference</option><option value="love">Love</option><option value="like">Like</option><option value="neutral">Neutral</option><option value="dislike">Dislike</option><option value="hate">Hate</option></select>
      <select v-model="filters.usage" aria-label="Filter by usage"><option value="">Any usage</option><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select>
      <select v-model="filters.disposal" aria-label="Filter by rehome status"><option value="">Any status</option><option value="no">Keeping</option><option value="yes">To rehome</option></select>
      <select v-model="filters.sort" aria-label="Sort wardrobe"><option value="updated">Recently updated</option><option value="added">Recently added</option><option value="name">Name</option><option value="category">Category</option><option value="preference">Preference</option></select>
      <button v-if="hasFilters" class="button ghost" @click="clearFilters">Clear</button>
    </div>
  </section>

  <div v-if="store.loading && !store.initialized" class="loading-card">Loading items…</div>
  <div v-else-if="items.length" class="card-list">
    <ClothingCard v-for="item in items" :key="item.id" :item="item" :categories="store.categoriesFor(item)" :usage="store.usageById(item.usageStatus)"
      @view="router.push(`/clothing/${item.id}`)" @edit="router.push(`/clothing/${item.id}/edit`)" @delete="remove(item)" @preference="store.setPreference(item.id,$event)" />
  </div>
  <div v-else class="empty-state"><h2>No items found</h2><p>{{ hasFilters ? 'Try clearing a filter.' : 'Add your first wardrobe item.' }}</p><button v-if="hasFilters" class="button secondary" @click="clearFilters">Clear filters</button><RouterLink v-else class="button primary" to="/clothing/add">Add item</RouterLink></div>
</template>
