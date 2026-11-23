<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { visibleClothes } from '../services'
import ClothingCard from '../components/ClothingCard.vue'
import AppIcon from '../components/AppIcon.vue'
import { PREFERENCES, SEASONS, OCCASIONS, itemColorLabel, preferenceOption } from '../data/options'
import { wardrobeFilters, resetWardrobeFilters } from '../composables/wardrobeFilters'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const filters = wardrobeFilters
const showMoreFilters = ref(false)
const selecting = ref(false)
const selectedIds = ref(new Set())
const bulk = reactive({ preference: '', categoryId: '', usageStatus: '' })

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'added', label: 'Recently added' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'preference', label: 'Rating (best first)' },
  { value: 'worn', label: 'Most worn' },
  { value: 'forgotten', label: 'Not worn lately' },
]
const LINKABLE = ['preference', 'usage', 'disposal', 'main', 'sort']

// A link such as /wardrobe?preference=love means "show me exactly this": start from a clean
// slate, apply it, then drop the query so it doesn't keep re-applying or stick around unseen.
watch(() => route.query, (query) => {
  const linked = Object.fromEntries(LINKABLE.filter((key) => query[key]).map((key) => [key, String(query[key])]))
  if (!Object.keys(linked).length) return
  resetWardrobeFilters(linked)
  router.replace({ path: '/wardrobe' })
}, { immediate: true })

const items = computed(() => visibleClothes(store.clothes.map((item) => ({
  ...item,
  categoryName: store.categoriesFor(item).map((category) => category.name).join(' '),
  colorLabel: itemColorLabel(item, store.customColors),
})), filters).filter((item) => (!filters.main || store.categoryById(item.categoryId)?.parentId === filters.main) && (!filters.season || item.seasons?.includes(filters.season) || item.seasons?.includes('All seasons')) && (!filters.occasion || item.occasions?.includes(filters.occasion))))

const activeFilters = computed(() => {
  const chips = []
  const main = store.mainCategories.find((entry) => entry.id === filters.main)
  if (main) chips.push({ keys: ['main', 'category'], label: `${main.icon} ${main.name}` })
  const sub = store.categoryById(filters.category)
  if (sub) chips.push({ keys: ['category'], label: `${sub.icon} ${sub.name}` })
  if (filters.preference) chips.push({ keys: ['preference'], label: `${preferenceOption(filters.preference).emoji} ${preferenceOption(filters.preference).label}` })
  if (filters.usage) chips.push({ keys: ['usage'], label: store.usageById(filters.usage)?.name || filters.usage })
  if (filters.disposal) chips.push({ keys: ['disposal'], label: filters.disposal === 'yes' ? 'To rehome' : 'Keeping' })
  if (filters.season) chips.push({ keys: ['season'], label: filters.season })
  if (filters.occasion) chips.push({ keys: ['occasion'], label: filters.occasion })
  if (filters.sort !== 'updated') chips.push({ keys: ['sort'], label: `Sort: ${SORT_OPTIONS.find((option) => option.value === filters.sort)?.label || filters.sort}`, reset: { sort: 'updated' } })
  return chips
})
const hasFilters = computed(() => Boolean(filters.search) || activeFilters.value.some((chip) => !chip.reset))
const extraFilterCount = computed(() => [filters.preference, filters.usage, filters.disposal, filters.season, filters.occasion, filters.sort !== 'updated'].filter(Boolean).length)
const selectedCount = computed(() => selectedIds.value.size)
const allVisibleSelected = computed(() => items.value.length > 0 && items.value.every((item) => selectedIds.value.has(item.id)))
const groupedCategories = computed(() => store.mainCategories.map((main) => ({ main, subs: store.categories.filter((entry) => entry.parentId === main.id) })).filter((group) => group.subs.length))

function removeFilter(chip) {
  for (const key of chip.keys) filters[key] = chip.reset?.[key] ?? ''
}
function clearFilters() { resetWardrobeFilters() }
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
  if (!window.confirm(`Delete ${selectedCount.value} selected item${selectedCount.value === 1 ? '' : 's'}?`)) return
  await store.bulkDeleteClothing([...selectedIds.value])
  finishSelection()
}
</script>

<template>
  <section class="page-heading keep-row">
    <div><p class="eyebrow">Inventory</p><h1>Wardrobe</h1><p>{{ items.length === store.clothes.length ? `${store.clothes.length} items` : `${items.length} of ${store.clothes.length} items` }}</p></div>
    <div class="heading-actions"><button v-if="!selecting" class="button secondary" @click="startSelection">Select</button><button v-else class="button ghost" @click="finishSelection">Done</button></div>
  </section>

  <section class="filter-panel" aria-label="Search and filters">
    <div class="filter-primary">
      <label class="search-field"><AppIcon name="search" :size="18" /><input v-model="filters.search" type="search" placeholder="Search name, colour, notes…" aria-label="Search wardrobe" /></label>
      <button class="button secondary filter-button" :class="{ 'has-count': extraFilterCount }" type="button" :aria-expanded="showMoreFilters" aria-controls="more-filters" @click="showMoreFilters = !showMoreFilters">
        <AppIcon name="filter" :size="18" /><span>Filters</span><b v-if="extraFilterCount" class="count-badge">{{ extraFilterCount }}</b>
      </button>
    </div>
    <div v-if="showMoreFilters" id="more-filters" class="filter-row">
      <select v-model="filters.preference" aria-label="Filter by rating"><option value="">Any rating</option><option v-for="option in PREFERENCES" :key="option.value" :value="option.value">{{ option.emoji }} {{ option.label }}</option></select>
      <select v-model="filters.usage" aria-label="Filter by usage"><option value="">Any usage</option><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select>
      <select v-model="filters.disposal" aria-label="Filter by rehome status"><option value="">Keeping & rehome</option><option value="no">Keeping</option><option value="yes">To rehome</option></select>
      <select v-model="filters.season" aria-label="Filter by season"><option value="">Any season</option><option v-for="season in SEASONS.slice(1)" :key="season">{{ season }}</option></select>
      <select v-model="filters.occasion" aria-label="Filter by occasion"><option value="">Any occasion</option><option v-for="occasion in OCCASIONS" :key="occasion">{{ occasion }}</option></select>
      <select v-model="filters.sort" aria-label="Sort wardrobe"><option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option></select>
    </div>
    <div v-if="activeFilters.length" class="active-filters" aria-label="Active filters">
      <button v-for="chip in activeFilters" :key="chip.label" type="button" class="filter-chip" :aria-label="`Remove ${chip.label}`" @click="removeFilter(chip)">{{ chip.label }}<AppIcon name="x" :size="14" /></button>
      <button v-if="activeFilters.length > 1" type="button" class="filter-chip clear" @click="clearFilters">Clear all</button>
    </div>
  </section>

  <section class="browse-groups" aria-label="Browse categories">
    <div class="category-chips"><button type="button" :class="{active:!filters.main}" :aria-pressed="!filters.main" @click="filters.main='';filters.category=''">All items</button><button v-for="main in store.mainCategories" :key="main.id" type="button" :class="{active:filters.main===main.id}" :aria-pressed="filters.main===main.id" @click="filters.main=main.id;filters.category=''">{{ main.icon }} {{ main.name }} <small>{{ store.mainCategoryCount(main.id) }}</small></button></div>
    <div v-if="filters.main" class="subcategory-chips"><button type="button" :class="{active:!filters.category}" :aria-pressed="!filters.category" @click="filters.category=''">All {{ store.mainCategories.find((entry)=>entry.id===filters.main)?.name }}</button><button v-for="sub in store.categories.filter((entry)=>entry.parentId===filters.main)" :key="sub.id" type="button" :class="{active:filters.category===sub.id}" :aria-pressed="filters.category===sub.id" @click="filters.category=sub.id">{{ sub.icon }} {{ sub.name }} <small>{{ store.categoryCount(sub.id) }}</small></button></div>
  </section>

  <section v-if="selecting" class="bulk-panel" aria-label="Bulk item actions">
    <div class="bulk-summary">
      <label class="check-field"><input type="checkbox" :checked="allVisibleSelected" @change="toggleAllVisible" /><span>Select all visible</span></label>
      <strong>{{ selectedCount }} selected</strong>
    </div>
    <div class="bulk-fields">
      <label class="field"><span>Rating</span><select v-model="bulk.preference"><option value="">No change</option><option v-for="option in PREFERENCES" :key="option.value" :value="option.value">{{ option.emoji }} {{ option.label }}</option></select></label>
      <label class="field"><span>Subcategory</span><select v-model="bulk.categoryId"><option value="">No change</option><optgroup v-for="group in groupedCategories" :key="group.main.id" :label="`${group.main.icon} ${group.main.name}`"><option v-for="category in group.subs" :key="category.id" :value="category.id">{{ category.icon }} {{ category.name }}</option></optgroup></select></label>
      <label class="field"><span>Usage</span><select v-model="bulk.usageStatus"><option value="">No change</option><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select></label>
    </div>
    <div class="bulk-actions"><button class="button danger" :disabled="!selectedCount" @click="deleteSelected">Delete selected</button><button class="button primary" :disabled="!selectedCount" @click="applyBulkChanges">Apply to {{ selectedCount }}</button></div>
  </section>

  <div v-if="store.loading && !store.initialized" class="card-list" aria-busy="true"><div v-for="n in 4" :key="n" class="skeleton-card"></div></div>
  <div v-else-if="items.length" class="card-list">
    <ClothingCard v-for="item in items" :key="item.id" :item="item" :categories="store.categoriesFor(item)" :usage="store.usageById(item.usageStatus)" :selection-mode="selecting" :selected="selectedIds.has(item.id)" quick-wear
      @select="toggleSelected(item.id)" @view="router.push(`/clothing/${item.id}`)" @wear="store.logWear(item.id)" />
  </div>
  <div v-else class="empty-state"><div class="empty-icon"><AppIcon :name="hasFilters ? 'search' : 'hanger'" :size="28" /></div><h2>{{ hasFilters ? 'Nothing matches' : 'Your wardrobe is empty' }}</h2><p>{{ hasFilters ? 'Try removing a filter or searching for something else.' : 'Add your first piece to get started.' }}</p><button v-if="hasFilters" class="button secondary" @click="clearFilters">Clear filters</button><RouterLink v-else class="button primary" to="/clothing/add">Add item</RouterLink></div>
</template>
