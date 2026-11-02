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
function open(type, entry = null, parentId = '') {
  kind.value = type
  editing.value = entry?.id || 'new'
  Object.assign(draft, { name: entry?.name || '', parentId: entry?.parentId || parentId || store.mainCategories[0]?.id || '', icon: entry?.icon || '👕' })
  error.value = ''
}
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
  <form v-if="editing" class="category-form" @submit.prevent="save">
    <h2>{{ editing === 'new' ? 'Add' : 'Edit' }} {{ kind === 'main' ? 'main category' : 'subcategory' }}</h2>
    <div class="category-fields"><label class="field"><span>Name</span><input v-model="draft.name" required /></label><label v-if="kind === 'subcategory'" class="field"><span>Main category</span><select v-model="draft.parentId"><option v-for="main in store.mainCategories" :key="main.id" :value="main.id">{{ main.name }}</option></select></label></div>
    <fieldset class="choice-field"><legend>Icon</legend><div class="icon-choices"><button v-for="icon in CATEGORY_ICONS" :key="icon" type="button" :class="{selected:draft.icon===icon}" @click="draft.icon=icon">{{ icon }}</button></div></fieldset>
    <p v-if="error" class="field-error">{{ error }}</p><div class="form-actions"><button type="button" class="button ghost" @click="editing=null">Cancel</button><button class="button primary">Save</button></div>
  </form>
  <section v-for="main in store.mainCategories" :key="main.id" class="category-group">
    <div class="section-heading"><h2>{{ main.icon }} {{ main.name }} <small>({{ store.mainCategoryCount(main.id) }})</small></h2><div class="heading-actions"><button class="button ghost" @click="open('subcategory',null,main.id)">+ Subcategory</button><button class="button ghost" @click="open('main',main)">Edit</button><button class="button danger" @click="removeMain(main)">Delete</button></div></div>
    <div class="category-list"><article v-for="sub in store.categories.filter((entry)=>entry.parentId===main.id)" :key="sub.id" class="category-card"><span class="category-icon">{{ sub.icon }}</span><div class="category-copy"><strong>{{ sub.name }}</strong><small>{{ store.categoryCount(sub.id) }} items</small></div><div class="category-actions"><button @click="open('subcategory',sub)">Edit</button><button class="danger-action" @click="removeSub(sub)">Delete</button></div></article></div>
  </section>
  <section class="category-group"><div class="section-heading"><div><h2>Wear status</h2><p>Regular, occasional, and other usage labels.</p></div><button class="button secondary" @click="Object.assign(usageDraft,{id:'',name:'',icon:'◷',color:'#789584'});showUsageForm=true">+ Status</button></div>
    <form v-if="showUsageForm" class="inline-fields" @submit.prevent="saveUsage"><input v-model="usageDraft.name" required aria-label="Status name" /><input v-model="usageDraft.icon" maxlength="3" aria-label="Status icon" /><input v-model="usageDraft.color" type="color" aria-label="Status colour" /><button class="button primary">Save</button><button type="button" class="button ghost" @click="showUsageForm=false">Cancel</button><span v-if="error" class="field-error">{{ error }}</span></form>
    <div class="category-list"><article v-for="(entry,index) in store.usages" :key="entry.id" class="category-card"><span class="category-icon">{{ entry.icon }}</span><div class="category-copy"><strong>{{ entry.name }}</strong><small>{{ store.usageCount(entry.id) }} items</small></div><div class="category-actions"><button :disabled="index===0" @click="store.moveUsage(entry.id,-1)">↑</button><button :disabled="index===store.usages.length-1" @click="store.moveUsage(entry.id,1)">↓</button><button @click="Object.assign(usageDraft,{id:entry.id,name:entry.name,icon:entry.icon,color:entry.color});showUsageForm=true;error=''">Edit</button><button class="danger-action" @click="removeUsage(entry)">Delete</button></div></article></div>
  </section>
</template>
