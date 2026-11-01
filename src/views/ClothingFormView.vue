<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { photoData, validateClothing } from '../services'
import { COLOR_OPTIONS, PREFERENCES } from '../data/options'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const editing = computed(() => route.name === 'edit')
const errors = ref({})
const saving = ref(false)
const saved = ref(false)
const initial = ref('')
const form = reactive({
  name: '', categoryIds: [], color: '#789584', preference: 'neutral', usageStatus: 'regular', quantity: 1,
  notes: '', purchaseDate: '', photo: '', photoType: '', markedForDisposal: false, disposalReason: '',
})

onMounted(async () => {
  if (!store.initialized) await store.load().catch(() => {})
  if (editing.value) {
    const item = store.clothingById(route.params.id)
    if (!item) return router.replace('/wardrobe')
    Object.assign(form, item, { categoryIds: item.categoryIds?.length ? [...item.categoryIds] : item.categoryId ? [item.categoryId] : [], color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#789584' })
  }
  if (!store.usageById(form.usageStatus)) form.usageStatus = store.usages[0]?.id || ''
  initial.value = JSON.stringify(form)
})

onBeforeRouteLeave(() => {
  if (!saved.value && initial.value && JSON.stringify(form) !== initial.value) return window.confirm('Discard your unsaved changes?')
})

function toggleCategory(id) {
  form.categoryIds = form.categoryIds.includes(id) ? form.categoryIds.filter((categoryId) => categoryId !== id) : [...form.categoryIds, id]
}
async function selectPhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try { const result = await photoData(file); form.photo = result.photo; form.photoType = result.photoType }
  catch (error) { errors.value = { photo: error.message } }
}
async function submit() {
  errors.value = validateClothing(form)
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    const item = await store.saveClothing({ ...form, categoryIds: [...form.categoryIds] }, editing.value ? route.params.id : null)
    saved.value = true
    router.replace(`/clothing/${item.id}`)
  } catch (error) {
    errors.value = { form: error.name === 'QuotaExceededError' ? 'Storage is full. Export a backup and remove large photos.' : 'This item could not be saved.' }
  } finally { saving.value = false }
}
</script>

<template>
  <section class="page-heading simple-heading"><div><p class="eyebrow">{{ editing ? 'Update' : 'Create' }}</p><h1>{{ editing ? 'Edit item' : 'Add item' }}</h1><p>Select one or more categories, a colour, preference, and usage.</p></div></section>
  <form class="form-card" @submit.prevent="submit">
    <div v-if="errors.form" class="alert alert-danger">{{ errors.form }}</div>
    <div class="form-grid">
      <label class="field field-wide"><span>Name *</span><input v-model="form.name" autocomplete="off" placeholder="e.g. Blue linen shirt" /><small v-if="errors.name" class="field-error">{{ errors.name }}</small></label>

      <fieldset class="choice-field field-wide"><legend>Categories *</legend><div class="category-choices"><button v-for="category in store.categories" :key="category.id" type="button" :class="{selected:form.categoryIds.includes(category.id)}" :aria-pressed="form.categoryIds.includes(category.id)" @click="toggleCategory(category.id)"><span>{{ category.icon }}</span>{{ category.name }}</button></div><small v-if="errors.categoryIds" class="field-error">{{ errors.categoryIds }}</small></fieldset>

      <fieldset class="choice-field field-wide"><legend>Colour</legend><div class="color-picker-row"><label class="custom-color"><input v-model="form.color" type="color" /><span>Custom</span></label><div class="color-swatches"><button v-for="colour in COLOR_OPTIONS" :key="colour.value" type="button" :class="{selected:form.color===colour.value}" :title="colour.label" :aria-label="colour.label" @click="form.color=colour.value"><span :style="{background:colour.value}"></span></button></div></div></fieldset>

      <fieldset class="choice-field field-wide"><legend>Preference *</legend><div class="preference-choices"><button v-for="option in PREFERENCES" :key="option.value" type="button" :class="{selected:form.preference===option.value}" :aria-pressed="form.preference===option.value" @click="form.preference=option.value"><span>{{ option.emoji }}</span>{{ option.label }}</button></div></fieldset>

      <label class="field"><span>Usage *</span><select v-model="form.usageStatus"><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select><small v-if="errors.usageStatus" class="field-error">{{ errors.usageStatus }}</small></label>
      <label class="field"><span>Quantity</span><input v-model.number="form.quantity" type="number" min="1" /><small v-if="errors.quantity" class="field-error">{{ errors.quantity }}</small></label>
      <label class="field"><span>Purchase date</span><input v-model="form.purchaseDate" type="date" /></label>
      <label class="field field-wide"><span>Notes</span><textarea v-model="form.notes" rows="3" placeholder="Optional notes"></textarea></label>
    </div>

    <section class="photo-field"><div><strong>Photo</strong><small>Stored only on this device. Without a photo, the first category icon is shown.</small></div><img v-if="form.photo" :src="form.photo" alt="Item preview" /><div class="button-row"><label class="button secondary file-button">{{ form.photo ? 'Replace photo' : 'Add photo' }}<input type="file" accept="image/*" capture="environment" @change="selectPhoto" /></label><button v-if="form.photo" type="button" class="button ghost" @click="form.photo='';form.photoType=''">Remove</button></div><small v-if="errors.photo" class="field-error">{{ errors.photo }}</small></section>
    <label class="check-field"><input v-model="form.markedForDisposal" type="checkbox" /><span>Mark for rehoming</span></label>
    <label v-if="form.markedForDisposal" class="field"><span>Rehoming reason *</span><textarea v-model="form.disposalReason" rows="2"></textarea><small v-if="errors.disposalReason" class="field-error">{{ errors.disposalReason }}</small></label>
    <div class="form-actions"><button type="button" class="button ghost" @click="router.back()">Cancel</button><button class="button primary" :disabled="saving">{{ saving ? 'Saving…' : editing ? 'Save changes' : 'Add item' }}</button></div>
  </form>
</template>
