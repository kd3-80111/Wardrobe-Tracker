<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { photoData, validateClothing } from '../services'
import { COLOR_OPTIONS, PREFERENCES, SEASONS, OCCASIONS } from '../data/options'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const editing = computed(() => route.name === 'edit')
const errors = ref({})
const saving = ref(false)
const saved = ref(false)
const showDetails = ref(false)
const selectedMain = ref('')
const customColorName = ref('')
const fetchingImage = ref(false)
const initial = ref('')
const form = reactive({
  name: '', categoryId: '', color: '#789584', colorName: 'Sage', preference: 'neutral', usageStatus: 'regular', quantity: 1,
  seasons: ['All seasons'], occasions: [], productUrl: '', totalWears: 0, wearsSinceWash: 0,
  notes: '', purchaseDate: '', photo: '', photoType: '', markedForDisposal: false, disposalReason: '',
})

onMounted(async () => {
  if (!store.initialized) await store.load().catch(() => {})
  if (editing.value) {
    const item = store.clothingById(route.params.id)
    if (!item) return router.replace('/wardrobe')
    Object.assign(form, item, { color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#789584', seasons: [...(item.seasons || ['All seasons'])], occasions: [...(item.occasions || [])] })
    showDetails.value = true
  }
  if (!store.usageById(form.usageStatus)) form.usageStatus = store.usages[0]?.id || ''
  selectedMain.value = store.categoryById(form.categoryId)?.parentId || store.mainCategories[0]?.id || ''
  initial.value = JSON.stringify(form)
})

onBeforeRouteLeave(() => {
  if (!saved.value && initial.value && JSON.stringify(form) !== initial.value) return window.confirm('Discard your unsaved changes?')
})

function toggleChoice(field, value) {
  form[field] = form[field].includes(value) ? form[field].filter((entry) => entry !== value) : [...form[field], value]
  if (field === 'seasons' && value === 'All seasons' && form.seasons.includes(value)) form.seasons = [value]
  else if (field === 'seasons' && value !== 'All seasons') form.seasons = form.seasons.filter((entry) => entry !== 'All seasons')
}
async function saveColor() { try { await store.saveCustomColor(customColorName.value, form.color); form.colorName = customColorName.value.trim(); customColorName.value = '' } catch (error) { errors.value = { ...errors.value, color: error.message } } }
async function selectPhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try { const result = await photoData(file); form.photo = result.photo; form.photoType = result.photoType }
  catch (error) { errors.value = { photo: error.message } }
}
async function tryProductImage() {
  fetchingImage.value = true
  errors.value = { ...errors.value, productImage: '' }
  try {
    const pageUrl = new URL(form.productUrl)
    if (!['http:', 'https:'].includes(pageUrl.protocol)) throw new Error('Use an http or https product link.')
    const response = await fetch(pageUrl)
    if (!response.ok) throw new Error('The store did not provide an image.')
    let imageUrl = pageUrl
    if (!response.headers.get('content-type')?.startsWith('image/')) {
      const document = new DOMParser().parseFromString(await response.text(), 'text/html')
      const preview = document.querySelector('meta[property="og:image"],meta[name="twitter:image"]')?.getAttribute('content')
      if (!preview) throw new Error('No product image was found on that page.')
      imageUrl = new URL(preview, pageUrl)
    }
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('The product image could not be downloaded.')
    const blob = await imageResponse.blob()
    const result = await photoData(blob)
    form.photo = result.photo
    form.photoType = result.photoType
  } catch (error) {
    errors.value = { ...errors.value, productImage: error instanceof TypeError ? 'This store blocks image access. Choose a photo from your gallery instead.' : error.message }
  } finally { fetchingImage.value = false }
}
async function submit() {
  errors.value = validateClothing(form)
  if (Object.keys(errors.value).length) { showDetails.value = true; return }
  saving.value = true
  try {
    const item = await store.saveClothing({ ...form, seasons: [...form.seasons], occasions: [...form.occasions] }, editing.value ? route.params.id : null)
    saved.value = true
    router.replace(`/clothing/${item.id}`)
  } catch (error) {
    errors.value = { form: error.name === 'QuotaExceededError' ? 'Storage is full. Export a backup and remove large photos.' : 'This item could not be saved.' }
  } finally { saving.value = false }
}
</script>

<template>
  <section class="page-heading simple-heading"><div><p class="eyebrow">{{ editing ? 'Update' : 'Create' }}</p><h1>{{ editing ? 'Edit item' : 'Add item' }}</h1><p>Start with a name and category. Everything else is optional.</p></div></section>
  <form class="form-card" @submit.prevent="submit">
    <div v-if="errors.form" class="alert alert-danger">{{ errors.form }}</div>
    <div class="form-grid">
      <label class="field field-wide"><span>Name *</span><input v-model="form.name" autocomplete="off" placeholder="e.g. Blue linen shirt" /><small v-if="errors.name" class="field-error">{{ errors.name }}</small></label>

      <label class="field"><span>Main category *</span><select v-model="selectedMain" @change="form.categoryId='' "><option v-for="main in store.mainCategories" :key="main.id" :value="main.id">{{ main.icon }} {{ main.name }}</option></select></label>
      <label class="field"><span>Subcategory *</span><select v-model="form.categoryId"><option value="">Choose subcategory</option><option v-for="category in store.categories.filter((entry)=>entry.parentId===selectedMain)" :key="category.id" :value="category.id">{{ category.icon }} {{ category.name }}</option></select><small v-if="errors.categoryId" class="field-error">{{ errors.categoryId }}</small></label>
    </div>
    <section class="photo-field"><div><strong>Photo</strong><small>Optional · stored on this device</small></div><img v-if="form.photo" :src="form.photo" alt="Item preview" /><div class="button-row"><label class="button secondary file-button">Take photo<input type="file" accept="image/*" capture="environment" @change="selectPhoto" /></label><label class="button secondary file-button">Choose from gallery<input type="file" accept="image/*" @change="selectPhoto" /></label><button v-if="form.photo" type="button" class="button ghost" @click="form.photo='';form.photoType=''">Remove</button></div><small v-if="errors.photo" class="field-error">{{ errors.photo }}</small></section>
    <button type="button" class="details-toggle" :aria-expanded="showDetails" aria-controls="item-more-details" @click="showDetails = !showDetails">{{ showDetails ? '− Hide details' : '+ More details' }} <span>Colour, preference, usage and notes</span></button>
    <div v-if="showDetails" id="item-more-details" class="form-grid optional-fields">
      <fieldset class="choice-field field-wide"><legend>Colour</legend><div class="color-picker-row"><label class="custom-color"><input v-model="form.color" type="color" @input="form.colorName=''" /><span>Custom</span></label><div class="color-swatches"><button v-for="colour in COLOR_OPTIONS" :key="colour.value" type="button" :class="{selected:form.color===colour.value}" :title="colour.label" :aria-label="colour.label" @click="form.color=colour.value;form.colorName=colour.label"><span :style="{background:colour.value}"></span></button></div></div></fieldset>
      <fieldset class="choice-field field-wide"><legend>Saved custom colours</legend><div class="category-choices"><button v-for="colour in store.customColors" :key="colour.id" type="button" :class="{selected:form.color===colour.value}" @click="form.color=colour.value;form.colorName=colour.name"><i class="colour-swatch" :style="{background:colour.value}"></i>{{ colour.name }}</button></div><div class="inline-fields"><input v-model="customColorName" placeholder="Name this colour" aria-label="Custom colour name" /><button type="button" class="button secondary" @click="saveColor">Save colour</button></div><small v-if="errors.color" class="field-error">{{ errors.color }}</small></fieldset>

      <fieldset class="choice-field field-wide"><legend>Rating</legend><div class="preference-choices"><button v-for="option in PREFERENCES" :key="option.value" type="button" :class="{selected:form.preference===option.value}" :aria-pressed="form.preference===option.value" @click="form.preference=option.value"><span>{{ option.emoji }}</span>{{ option.label }}</button></div></fieldset>
      <fieldset class="choice-field field-wide"><legend>Seasons</legend><div class="category-choices"><button v-for="season in SEASONS" :key="season" type="button" :class="{selected:form.seasons.includes(season)}" :aria-pressed="form.seasons.includes(season)" @click="toggleChoice('seasons',season)">{{ season }}</button></div></fieldset>
      <fieldset class="choice-field field-wide"><legend>Occasions</legend><div class="category-choices"><button v-for="occasion in OCCASIONS" :key="occasion" type="button" :class="{selected:form.occasions.includes(occasion)}" :aria-pressed="form.occasions.includes(occasion)" @click="toggleChoice('occasions',occasion)">{{ occasion }}</button></div></fieldset>

      <label class="field"><span>Usage *</span><select v-model="form.usageStatus"><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select><small v-if="errors.usageStatus" class="field-error">{{ errors.usageStatus }}</small></label>
      <label class="field"><span>Quantity</span><input v-model.number="form.quantity" type="number" min="1" /><small v-if="errors.quantity" class="field-error">{{ errors.quantity }}</small></label>
      <label class="field"><span>Purchase date</span><input v-model="form.purchaseDate" type="date" /></label>
      <label class="field field-wide"><span>Notes</span><textarea v-model="form.notes" rows="3" placeholder="Optional notes"></textarea></label>
      <label class="field field-wide"><span>Product link</span><input v-model="form.productUrl" type="url" placeholder="https://…" /></label>
      <div class="field field-wide"><button type="button" class="button secondary" :disabled="!form.productUrl || fetchingImage" @click="tryProductImage">{{ fetchingImage ? 'Looking for image…' : 'Try image from product link' }}</button><small v-if="errors.productImage" class="field-error">{{ errors.productImage }}</small></div>
    </div>

    <template v-if="showDetails"><label class="check-field"><input v-model="form.markedForDisposal" type="checkbox" /><span>Mark for rehoming</span></label>
    <label v-if="form.markedForDisposal" class="field"><span>Rehoming reason *</span><textarea v-model="form.disposalReason" rows="2"></textarea><small v-if="errors.disposalReason" class="field-error">{{ errors.disposalReason }}</small></label></template>
    <div class="form-actions"><button type="button" class="button ghost" @click="router.back()">Cancel</button><button class="button primary" :disabled="saving">{{ saving ? 'Saving…' : editing ? 'Save changes' : 'Add item' }}</button></div>
  </form>
</template>
