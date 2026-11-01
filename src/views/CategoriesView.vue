<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { CATEGORY_ICONS, colorName } from '../data/options'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const activeTab = computed(() => route.query.tab === 'usages' ? 'usages' : 'categories')
const editingId = ref(null)
const showForm = ref(false)
const error = ref('')
const categoryDraft = reactive({ name: '', description: '', color: '#789584', icon: '👕' })
const usageDraft = reactive({ name: '', description: '', color: '#789584', icon: '◷' })
const usageIcons = ['↻', '◷', '◆', '!', '⌂', '☀', '☾', '✦', '●', '★']
const activeDraft = computed(() => activeTab.value === 'categories' ? categoryDraft : usageDraft)

function switchTab(tab) { reset(); router.replace({ path: '/categories', query: tab === 'usages' ? { tab: 'usages' } : {} }) }
function reset() { editingId.value = null; showForm.value = false; error.value = ''; Object.assign(categoryDraft, { name: '', description: '', color: '#789584', icon: '👕' }); Object.assign(usageDraft, { name: '', description: '', color: '#789584', icon: '◷' }) }
function create() { reset(); showForm.value = true }
function edit(item) {
  editingId.value = item.id; showForm.value = true; error.value = ''
  if (activeTab.value === 'categories') Object.assign(categoryDraft, { name: item.name, description: item.description, color: item.color, icon: item.icon })
  else Object.assign(usageDraft, { name: item.name, description: item.description, color: item.color, icon: item.icon })
}
async function save() {
  const draft = activeTab.value === 'categories' ? categoryDraft : usageDraft
  if (!draft.name.trim()) return error.value = 'Name is required.'
  try {
    if (activeTab.value === 'categories') await store.saveCategory({ ...draft }, editingId.value)
    else await store.saveUsage({ ...draft }, editingId.value)
    reset()
  } catch (exception) { error.value = exception.message }
}
async function removeCategory(category) {
  const count = store.categoryCount(category.id), target = store.categories.find((item) => item.id !== category.id)
  if (count && !target) return store.notify('Create another category before deleting this one')
  const message = count ? `Replace “${category.name}” with “${target.name}” on ${count} item${count === 1 ? '' : 's'}?` : `Delete “${category.name}”?`
  if (window.confirm(message)) await store.deleteCategory(category.id, count ? target.id : null)
}
async function removeUsage(usage) {
  const count = store.usageCount(usage.id), target = store.usages.find((item) => item.id !== usage.id)
  if (count && !target) return store.notify('Create another usage before deleting this one')
  const message = count ? `Move ${count} item${count === 1 ? '' : 's'} to “${target.name}” and delete “${usage.name}”?` : `Delete “${usage.name}”?`
  if (window.confirm(message)) await store.deleteUsage(usage.id, count ? target.id : null)
}
function colorBreakdown(categoryId) {
  const counts = new Map()
  for (const item of store.clothes) {
    const ids = item.categoryIds?.length ? item.categoryIds : [item.categoryId]
    if (!ids.includes(categoryId)) continue
    const colour = /^#[0-9a-f]{6}$/i.test(item.color) ? item.color.toLowerCase() : '#8a8f8b'
    counts.set(colour, (counts.get(colour) || 0) + (Number(item.quantity) || 1))
  }
  return [...counts.entries()].map(([colour, count]) => ({ colour, count, name: colorName(colour) })).sort((a, b) => b.count - a.count)
}
</script>

<template>
  <section class="page-heading"><div><p class="eyebrow">Organize</p><h1>Categories & usage</h1><p>Manage how items are grouped and filtered.</p></div><button class="button primary" @click="create">+ Add {{ activeTab === 'categories' ? 'category' : 'usage' }}</button></section>
  <div class="tabs" role="tablist"><button :class="{active:activeTab==='categories'}" role="tab" :aria-selected="activeTab==='categories'" @click="switchTab('categories')">Categories</button><button :class="{active:activeTab==='usages'}" role="tab" :aria-selected="activeTab==='usages'" @click="switchTab('usages')">Usage</button></div>

  <form v-if="showForm" class="category-form" @submit.prevent="save">
    <div class="section-heading"><h2>{{ editingId ? 'Edit' : 'New' }} {{ activeTab === 'categories' ? 'category' : 'usage' }}</h2><button type="button" class="icon-button small" aria-label="Close form" @click="reset">×</button></div>
    <div class="category-fields">
      <label class="field"><span>Name *</span><input v-model="activeDraft.name" /></label>
      <label class="field"><span>Colour</span><input v-model="activeDraft.color" type="color" /></label>
      <label class="field field-wide"><span>Description</span><input v-model="activeDraft.description" /></label>
      <fieldset class="choice-field field-wide"><legend>Icon</legend><div class="icon-choices"><button v-for="icon in (activeTab==='categories'?CATEGORY_ICONS:usageIcons)" :key="icon" type="button" :class="{selected:activeDraft.icon===icon}" :aria-label="`Select ${icon} icon`" @click="activeDraft.icon=icon">{{ icon }}</button></div></fieldset>
    </div>
    <p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="reset">Cancel</button><button class="button primary">Save</button></div>
  </form>

  <div v-if="activeTab==='categories'" class="category-list">
    <article v-for="(category,index) in store.categories" :key="category.id" class="category-card spectrum-card">
      <span class="category-icon" :style="{background:`${category.color}22`,color:category.color}">{{ category.icon || '◈' }}</span>
      <div class="category-copy"><strong>{{ category.name }}</strong><small>{{ store.categoryCount(category.id) }} items<template v-if="category.description"> · {{ category.description }}</template></small>
        <div v-if="colorBreakdown(category.id).length" class="spectrum" :aria-label="`${category.name} colour distribution`"><span v-for="colour in colorBreakdown(category.id)" :key="colour.colour" :style="{background:colour.colour,flexGrow:colour.count}" :title="`${colour.name}: ${colour.count}`"></span></div>
        <div v-if="colorBreakdown(category.id).length" class="spectrum-legend"><span v-for="colour in colorBreakdown(category.id)" :key="colour.colour"><i :style="{background:colour.colour}"></i>{{ colour.name }} {{ colour.count }}</span></div>
      </div>
      <div class="category-actions"><button :disabled="index===0" aria-label="Move up" @click="store.moveCategory(category.id,-1)">↑</button><button :disabled="index===store.categories.length-1" aria-label="Move down" @click="store.moveCategory(category.id,1)">↓</button><button @click="edit(category)">Edit</button><button class="danger-action" @click="removeCategory(category)">Delete</button></div>
    </article>
  </div>

  <div v-else class="category-list">
    <article v-for="(usage,index) in store.usages" :key="usage.id" class="category-card">
      <span class="category-icon" :style="{background:`${usage.color}22`,color:usage.color}">{{ usage.icon }}</span>
      <div class="category-copy"><strong>{{ usage.name }}</strong><small>{{ store.usageCount(usage.id) }} items<template v-if="usage.description"> · {{ usage.description }}</template></small></div>
      <div class="category-actions"><button :disabled="index===0" aria-label="Move up" @click="store.moveUsage(usage.id,-1)">↑</button><button :disabled="index===store.usages.length-1" aria-label="Move down" @click="store.moveUsage(usage.id,1)">↓</button><button @click="edit(usage)">Edit</button><button class="danger-action" @click="removeUsage(usage)">Delete</button></div>
    </article>
  </div>
</template>
