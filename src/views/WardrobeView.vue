<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { visibleClothes } from '../services'
import ClothingCard from '../components/ClothingCard.vue'
import { PREFERENCES } from '../data/options'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const filters = reactive({ search: '', category: '', preference: '', usage: '', disposal: '', sort: 'updated' })
const selecting = ref(false)
const selectedIds = ref(new Set())
const bulk = reactive({ preference: '', categoryId: '', usageStatus: '' })

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
const selectedCount = computed(() => selectedIds.value.size)
const allVisibleSelected = computed(() => items.value.length > 0 && items.value.every((item) => selectedIds.value.has(item.id)))

function clearFilters() {
  Object.assign(filters, { search: '', category: '', preference: '', usage: '', disposal: '', sort: 'updated' })
  router.replace('/wardrobe')
}
async function remove(item) {
  if (window.confirm(`Delete “${item.name}” permanently?`)) await store.deleteClothing(item.id)
}
function startSelection() { selecting.value = true; selectedIds.value = new Set() }
function finishSelection() { selecting.value = false; selectedIds.value = new Set(); Object.assign(bulk, { preference: '', categoryId: '', usageStatus: '' }) }
function toggleSelected(id) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}
function toggleAllVisible() {
  const next = new Set(selectedIds.value)
  if (allVisibleSelected.value) items.value.forEach((item) => next.delete(item.id))
  else items.value.forEach((item) => next.add(item.id))
  selectedIds.value = next
}
async function applyBulkChanges() {
  if (!selectedCount.value) return
  if (!bulk.preference && !bulk.categoryId && !bulk.usageStatus) return store.notify('Choose at least one change')
  await store.bulkUpdateClothing([...selectedIds.value], { ...bulk })
  finishSelection()
}
async function deleteSelected() {
  if (!selectedCount.value) return
  if (!window.confirm(`Delete ${selectedCount.value} selected item${selectedCount.value === 1 ? '' : 's'} permanently?`)) return
  await store.bulkDeleteClothing([...selectedIds.value])
  finishSelection()
}
</script>

<template>
  <section class="page-heading">
    <div><p class="eyebrow">Inventory</p><h1>Wardrobe</h1><p>{{ items.length }} of {{ store.clothes.length }} items</p></div>
    <div class="heading-actions"><button v-if="!selecting" class="button secondary" @click="startSelection">Select</button><button v-else class="button ghost" @click="finishSelection">Cancel</button><RouterLink class="button primary" to="/clothing/add">+ Add item</RouterLink></div>
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

  <section v-if="selecting" class="bulk-panel" aria-label="Bulk item actions">
    <div class="bulk-summary">
      <label class="check-field"><input type="checkbox" :checked="allVisibleSelected" @change="toggleAllVisible" /><span>Select all visible</span></label>
      <strong>{{ selectedCount }} selected</strong>
    </div>
    <div class="bulk-fields">
      <label class="field"><span>Preference</span><select v-model="bulk.preference"><option value="">No change</option><option v-for="option in PREFERENCES" :key="option.value" :value="option.value">{{ option.emoji }} {{ option.label }}</option></select></label>
      <label class="field"><span>Category</span><select v-model="bulk.categoryId"><option value="">No change</option><option v-for="category in store.categories" :key="category.id" :value="category.id">{{ category.icon }} {{ category.name }}</option></select></label>
      <label class="field"><span>Usage</span><select v-model="bulk.usageStatus"><option value="">No change</option><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select></label>
    </div>
    <p class="bulk-help">Changing category replaces the selected items’ current categories.</p>
    <div class="bulk-actions"><button class="button danger" :disabled="!selectedCount" @click="deleteSelected">Delete selected</button><button class="button primary" :disabled="!selectedCount" @click="applyBulkChanges">Apply changes</button></div>
  </section>

  <div v-if="store.loading && !store.initialized" class="loading-card">Loading items…</div>
  <div v-else-if="items.length" class="card-list">
    <ClothingCard v-for="item in items" :key="item.id" :item="item" :categories="store.categoriesFor(item)" :usage="store.usageById(item.usageStatus)" :selection-mode="selecting" :selected="selectedIds.has(item.id)"
      @select="toggleSelected(item.id)" @view="router.push(`/clothing/${item.id}`)" @edit="router.push(`/clothing/${item.id}/edit`)" @delete="remove(item)" @preference="store.setPreference(item.id,$event)" />
  </div>
  <div v-else class="empty-state"><h2>No items found</h2><p>{{ hasFilters ? 'Try clearing a filter.' : 'Add your first wardrobe item.' }}</p><button v-if="hasFilters" class="button secondary" @click="clearFilters">Clear filters</button><RouterLink v-else class="button primary" to="/clothing/add">Add item</RouterLink></div>
</template>
