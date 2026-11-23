<script setup>
import { reactive, ref } from 'vue'
import { useWardrobeStore } from '../stores/wardrobe'
import { CATEGORY_ICONS } from '../data/options'

const store = useWardrobeStore()
const editing = ref(null)
const kind = ref('subcategory')
const error = ref('')
const draft = reactive({ name: '', parentId: '', icon: '👕' })
const usageDraft = reactive({ id: '', name: '', icon: '◷', color: '#789584' })
const showUsageForm = ref(false)
const editingParentId = ref('')
// Kept locally: store records are replaced on every reload, so flags on them would reset.
const collapsed = ref(new Set())
const isCollapsed = (id) => collapsed.value.has(id)
function toggleCollapsed(id) {
  const next = new Set(collapsed.value)
  next.has(id) ? next.delete(id) : next.add(id)
  collapsed.value = next
}
function open(type, entry = null, parentId = '') {
  kind.value = type
  editing.value = entry?.id || 'new'
  editingParentId.value = entry?.parentId || parentId
  if (isCollapsed(editingParentId.value)) toggleCollapsed(editingParentId.value)
  Object.assign(draft, { name: entry?.name || '', parentId: entry?.parentId || parentId || store.mainCategories[0]?.id || '', icon: entry?.icon || '👕' })
  error.value = ''
}
function startNewSubcategory(parentId) { open('subcategory', null, parentId) }
function startNewUsage() { Object.assign(usageDraft, { id: '', name: '', icon: '◷', color: '#789584' }); error.value = ''; showUsageForm.value = true }
function editUsage(entry) { Object.assign(usageDraft, { id: entry.id, name: entry.name, icon: entry.icon || '◷', color: entry.color || '#789584' }); error.value = ''; showUsageForm.value = true }
async function save() {
  try {
    if (kind.value === 'main') await store.saveMainCategory(draft, editing.value === 'new' ? null : editing.value)
    else await store.saveCategory(draft, editing.value === 'new' ? null : editing.value)
    editing.value = null
  } catch (exception) { error.value = exception.message }
}
async function removeMain(entry) {
  const replacement = store.mainCategories.find((candidate) => candidate.id !== entry.id)
  if (!replacement) return store.notify('Keep at least one main category')
  if (window.confirm(`Delete “${entry.name}” and move its subcategories to “${replacement.name}”?`)) await store.deleteMainCategory(entry.id, replacement.id)
}
async function removeSub(entry) {
  const replacement = store.categories.find((candidate) => candidate.id !== entry.id && candidate.parentId === entry.parentId)
  if (store.categoryCount(entry.id) && !replacement) return store.notify('Create another subcategory here first')
  if (window.confirm(`Delete “${entry.name}”${store.categoryCount(entry.id) ? ` and move its items to “${replacement.name}”` : ''}?`)) await store.deleteCategory(entry.id, replacement?.id)
}
async function saveUsage() {
  try {
    await store.saveUsage(usageDraft, usageDraft.id || null)
    showUsageForm.value = false
  } catch (exception) { error.value = exception.message }
}
async function removeUsage(entry) {
  const replacement = store.usages.find((candidate) => candidate.id !== entry.id)
  if (store.usageCount(entry.id) && !replacement) return store.notify('Keep another usage first')
  if (window.confirm(`Delete “${entry.name}”${store.usageCount(entry.id) ? ` and move its items to “${replacement.name}”` : ''}?`)) await store.deleteUsage(entry.id, replacement?.id)
}
</script>

<template>
  <section class="page-heading"><div><p class="eyebrow">Organize</p><h1>Categories</h1><p>Every item belongs to one subcategory.</p></div><button class="button primary" @click="open('main')">+ Main category</button></section>
  <form v-if="editing && editing === 'new' && kind === 'main'" class="category-form" @submit.prevent="save">
    <h2>{{ editing === 'new' ? 'Add' : 'Edit' }} {{ kind === 'main' ? 'main category' : 'subcategory' }}</h2>
    <div class="category-fields"><label class="field"><span>Name</span><input v-model="draft.name" required /></label><label v-if="kind === 'subcategory'" class="field"><span>Main category</span><select v-model="draft.parentId"><option v-for="main in store.mainCategories" :key="main.id" :value="main.id">{{ main.name }}</option></select></label></div>
    <fieldset class="choice-field"><legend>Icon</legend><div class="icon-choices"><button v-for="icon in CATEGORY_ICONS" :key="icon" type="button" :class="{selected:draft.icon===icon}" @click="draft.icon=icon">{{ icon }}</button></div></fieldset>
    <p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="editing=null">Cancel</button><button class="button primary">Save</button></div>
  </form>
  <section v-for="main in store.mainCategories" :key="main.id" class="category-group">
    <div class="section-heading"><button class="collapse-toggle" type="button" :aria-expanded="!isCollapsed(main.id)" @click="toggleCollapsed(main.id)"><span class="collapse-chevron" :class="{collapsed:isCollapsed(main.id)}">⌄</span><h2>{{ main.icon }} {{ main.name }} <small>({{ store.mainCategoryCount(main.id) }})</small></h2></button><div class="heading-actions"><button class="button ghost" @click="startNewSubcategory(main.id)">+ Subcategory</button><button class="button ghost" @click="open('main',main)">Edit</button><button class="button danger" @click="removeMain(main)">Delete</button></div></div>
    <form v-if="editing === main.id && kind === 'main'" class="inline-edit-form" @submit.prevent="save"><label class="field"><span>Main category name</span><input v-model="draft.name" required /></label><fieldset class="choice-field"><legend>Icon</legend><div class="icon-choices"><button v-for="icon in CATEGORY_ICONS" :key="icon" type="button" :class="{selected:draft.icon===icon}" @click="draft.icon=icon">{{ icon }}</button></div></fieldset><p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="editing=null">Cancel</button><button class="button primary">Save category</button></div></form>
    <div v-if="!isCollapsed(main.id)" class="category-list">
      <form v-if="editing === 'new' && kind === 'subcategory' && editingParentId === main.id" class="inline-edit-form" @submit.prevent="save"><div class="category-fields"><label class="field"><span>Subcategory name</span><input v-model="draft.name" required autofocus /></label><label class="field"><span>Main category</span><select v-model="draft.parentId"><option v-for="candidate in store.mainCategories" :key="candidate.id" :value="candidate.id">{{ candidate.name }}</option></select></label></div><fieldset class="choice-field"><legend>Icon</legend><div class="icon-choices"><button v-for="icon in CATEGORY_ICONS" :key="icon" type="button" :class="{selected:draft.icon===icon}" @click="draft.icon=icon">{{ icon }}</button></div></fieldset><p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="editing=null">Cancel</button><button class="button primary">Save subcategory</button></div></form>
      <article v-for="sub in store.categories.filter((entry)=>entry.parentId===main.id)" :key="sub.id" class="category-card"><template v-if="editing === sub.id && kind === 'subcategory'"><form class="inline-edit-form category-inline-form" @submit.prevent="save"><div class="category-fields"><label class="field"><span>Subcategory name</span><input v-model="draft.name" required autofocus /></label><label class="field"><span>Main category</span><select v-model="draft.parentId"><option v-for="candidate in store.mainCategories" :key="candidate.id" :value="candidate.id">{{ candidate.name }}</option></select></label></div><fieldset class="choice-field"><legend>Icon</legend><div class="icon-choices"><button v-for="icon in CATEGORY_ICONS" :key="icon" type="button" :class="{selected:draft.icon===icon}" @click="draft.icon=icon">{{ icon }}</button></div></fieldset><p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="editing=null">Cancel</button><button class="button primary">Save subcategory</button></div></form></template><template v-else><span class="category-icon">{{ sub.icon }}</span><div class="category-copy"><strong>{{ sub.name }}</strong><small>{{ store.categoryCount(sub.id) }} items</small></div><div class="category-actions"><button @click="open('subcategory',sub)">Edit</button><button class="danger-action" @click="removeSub(sub)">Delete</button></div></template></article>
    </div>
  </section>
  <section class="category-group"><div class="section-heading"><div><h2>Wear status</h2><p>Regular, occasional, and other usage labels.</p></div><button class="button secondary" @click="startNewUsage">+ Status</button></div>
    <form v-if="showUsageForm" class="inline-edit-form usage-edit-form" @submit.prevent="saveUsage"><div class="usage-fields"><label class="field"><span>Status name</span><input v-model="usageDraft.name" required placeholder="e.g. Regular" /></label><label class="field usage-icon-field"><span>Emoji</span><input v-model="usageDraft.icon" maxlength="4" inputmode="text" placeholder="↻" aria-label="Wear status emoji" /></label><label class="field usage-color-field"><span>Colour</span><input v-model="usageDraft.color" type="color" aria-label="Status colour" /></label></div><small class="form-help">Enter one emoji or a short symbol. The status name and emoji are saved separately.</small><p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="showUsageForm=false">Cancel</button><button class="button primary">Save status</button></div></form>
    <div class="category-list"><article v-for="(entry,index) in store.usages" :key="entry.id" class="category-card"><span class="category-icon">{{ entry.icon }}</span><div class="category-copy"><strong>{{ entry.name }}</strong><small>{{ store.usageCount(entry.id) }} items</small></div><div class="category-actions"><button :disabled="index===0" :aria-label="`Move ${entry.name} up`" @click="store.moveUsage(entry.id,-1)">↑</button><button :disabled="index===store.usages.length-1" :aria-label="`Move ${entry.name} down`" @click="store.moveUsage(entry.id,1)">↓</button><button @click="editUsage(entry)">Edit</button><button class="danger-action" @click="removeUsage(entry)">Delete</button></div></article></div>
  </section>
</template>
