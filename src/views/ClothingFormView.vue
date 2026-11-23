<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { photoData, validateClothing } from '../services'
import { COLOR_OPTIONS, PREFERENCES, SEASONS, OCCASIONS } from '../data/options'
import AppIcon from '../components/AppIcon.vue'

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
const nameInput = ref(null)
const addedThisVisit = ref([])

const blankForm = () => ({
  name: '', categoryId: '', color: '', colorName: '', preference: 'neutral', usageStatus: store.usages[0]?.id || 'regular', quantity: 1,
  seasons: ['All seasons'], occasions: [], productUrl: '', totalWears: 0, wearsSinceWash: 0,
  notes: '', purchaseDate: '', photo: '', photoType: '', markedForDisposal: false, disposalReason: '',
})
const form = reactive(blankForm())
const isPresetColor = computed(() => COLOR_OPTIONS.some((option) => option.value === form.color))
const subcategories = computed(() => store.categories.filter((entry) => entry.parentId === selectedMain.value))
const snapshot = () => JSON.stringify(form)

onMounted(async () => {
  if (!store.initialized) await store.load().catch(() => {})
  if (editing.value) {
    const item = store.clothingById(route.params.id)
    if (!item) return router.replace('/wardrobe')
    Object.assign(form, item, { color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '', seasons: [...(item.seasons || ['All seasons'])], occasions: [...(item.occasions || [])] })
    showDetails.value = true
  }
  if (!store.usageById(form.usageStatus)) form.usageStatus = store.usages[0]?.id || ''
  selectedMain.value = store.categoryById(form.categoryId)?.parentId || store.mainCategories[0]?.id || ''
  initial.value = snapshot()
  if (!editing.value) nameInput.value?.focus()
})

onBeforeRouteLeave(() => {
  if (!saved.value && initial.value && snapshot() !== initial.value) return window.confirm('Discard your unsaved changes?')
})

function chooseMain(id) {
  if (selectedMain.value === id) return
  selectedMain.value = id
  form.categoryId = ''
}
function setColor(value, name = '') { form.color = value; form.colorName = name }
function toggleChoice(field, value) {
  form[field] = form[field].includes(value) ? form[field].filter((entry) => entry !== value) : [...form[field], value]
  if (field === 'seasons' && value === 'All seasons' && form.seasons.includes(value)) form.seasons = [value]
  else if (field === 'seasons' && value !== 'All seasons') form.seasons = form.seasons.filter((entry) => entry !== 'All seasons')
}
async function saveColor() { try { await store.saveCustomColor(customColorName.value, form.color); form.colorName = customColorName.value.trim(); customColorName.value = '' } catch (error) { errors.value = { ...errors.value, color: error.message } } }
async function selectPhoto(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try { const result = await photoData(file); form.photo = result.photo; form.photoType = result.photoType; errors.value = { ...errors.value, photo: '' } }
  catch (error) { errors.value = { ...errors.value, photo: error.message } }
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

// Keep the category and usage so a drawer of similar items can be entered quickly.
async function startNextItem(lastName) {
  const keep = { categoryId: form.categoryId, usageStatus: form.usageStatus }
  Object.assign(form, blankForm(), keep)
  addedThisVisit.value = [...addedThisVisit.value, lastName]
  errors.value = {}
  initial.value = snapshot()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await nextTick()
  nameInput.value?.focus()
}

async function submit(addAnother = false) {
  errors.value = validateClothing(form)
  if (Object.keys(errors.value).length) {
    if (Object.keys(errors.value).some((key) => !['name', 'categoryId'].includes(key))) showDetails.value = true
    if (errors.value.name) nameInput.value?.focus()
    return
  }
  saving.value = true
  try {
    const name = form.name.trim()
    const values = { ...form, seasons: [...form.seasons], occasions: [...form.occasions] }
    const item = await store.saveClothing(values, editing.value ? route.params.id : null, { message: addAnother ? `Added “${name}” · ready for the next one` : '' })
    if (addAnother) return startNextItem(name)
    saved.value = true
    router.replace(`/clothing/${item.id}`)
  } catch (error) {
    errors.value = { form: error.name === 'QuotaExceededError' ? 'Storage is full. Export a backup and remove large photos.' : 'This item could not be saved.' }
  } finally { saving.value = false }
}
function cancel() {
  if (window.history.state?.back) router.back()
  else router.push(editing.value ? `/clothing/${route.params.id}` : '/wardrobe')
}
</script>

<template>
  <section class="page-heading simple-heading"><div><p class="eyebrow">{{ editing ? 'Update' : 'Create' }}</p><h1>{{ editing ? 'Edit item' : 'Add item' }}</h1><p>Start with a name and category. Everything else is optional.</p></div></section>
  <div v-if="addedThisVisit.length" class="alert alert-success added-banner">
    <AppIcon name="check" :size="18" />
    <span><strong>{{ addedThisVisit.length }} added</strong> · last: {{ addedThisVisit.at(-1) }}</span>
    <RouterLink to="/wardrobe">View wardrobe</RouterLink>
  </div>
  <form class="form-card" novalidate @submit.prevent="submit(false)">
    <div v-if="errors.form" class="alert alert-danger">{{ errors.form }}</div>
    <div class="form-grid">
      <label class="field field-wide"><span>Name *</span><input ref="nameInput" v-model="form.name" autocomplete="off" enterkeyhint="done" placeholder="e.g. Blue linen shirt" :aria-invalid="!!errors.name" /><small v-if="errors.name" class="field-error">{{ errors.name }}</small></label>

      <fieldset class="choice-field field-wide"><legend>Category *</legend>
        <div class="segment-scroll" role="group" aria-label="Main category"><button v-for="main in store.mainCategories" :key="main.id" type="button" class="pill" :class="{ selected: selectedMain === main.id }" :aria-pressed="selectedMain === main.id" @click="chooseMain(main.id)">{{ main.icon }} {{ main.name }}</button></div>
        <div class="category-choices sub-choices" role="group" aria-label="Subcategory">
          <button v-for="category in subcategories" :key="category.id" type="button" :class="{ selected: form.categoryId === category.id }" :aria-pressed="form.categoryId === category.id" @click="form.categoryId = category.id"><span>{{ category.icon }}</span>{{ category.name }}</button>
          <RouterLink v-if="!subcategories.length" class="button ghost" to="/categories">Add a subcategory first</RouterLink>
        </div>
        <small v-if="errors.categoryId" class="field-error">{{ errors.categoryId }}</small>
      </fieldset>
    </div>
    <section class="photo-field">
      <div class="photo-preview" :class="{ empty: !form.photo }"><img v-if="form.photo" :src="form.photo" alt="Item preview" /><span v-else aria-hidden="true">{{ store.categoryById(form.categoryId)?.icon || '📷' }}</span></div>
      <div class="photo-copy"><strong>Photo</strong><small>Optional · stored on this device</small>
        <div class="button-row"><label class="button secondary file-button">Take photo<input type="file" accept="image/*" capture="environment" @change="selectPhoto" /></label><label class="button secondary file-button">Choose from gallery<input type="file" accept="image/*" @change="selectPhoto" /></label><button v-if="form.photo" type="button" class="button ghost" @click="form.photo='';form.photoType=''">Remove</button></div>
        <small v-if="errors.photo" class="field-error">{{ errors.photo }}</small>
      </div>
    </section>
    <button type="button" class="details-toggle" :aria-expanded="showDetails" aria-controls="item-more-details" @click="showDetails = !showDetails"><b>{{ showDetails ? 'Hide details' : 'More details' }}</b> <span>Colour, rating, seasons, usage, notes</span><AppIcon name="chevron" class="details-chevron" :class="{ open: showDetails }" /></button>
    <div v-if="showDetails" id="item-more-details" class="form-grid optional-fields">
      <fieldset class="choice-field field-wide"><legend>Colour <small v-if="form.color" class="legend-note">{{ form.colorName || 'Custom' }}</small></legend>
        <div class="color-swatches">
          <button type="button" class="no-colour" :class="{ selected: !form.color }" title="No colour" aria-label="No colour" :aria-pressed="!form.color" @click="setColor('')"><AppIcon name="x" :size="14" /></button>
          <button v-for="colour in COLOR_OPTIONS" :key="colour.value" type="button" :class="{ selected: form.color === colour.value }" :title="colour.label" :aria-label="colour.label" :aria-pressed="form.color === colour.value" @click="setColor(colour.value, colour.label)"><span :style="{ background: colour.value }"></span></button>
          <button v-for="colour in store.customColors" :key="colour.id" type="button" :class="{ selected: form.color === colour.value }" :title="colour.name" :aria-label="colour.name" :aria-pressed="form.color === colour.value" @click="setColor(colour.value, colour.name)"><span :style="{ background: colour.value }"></span></button>
          <label class="custom-color" title="Pick any colour"><input :value="form.color || '#789584'" type="color" aria-label="Pick a custom colour" @input="setColor($event.target.value)" /><span>Custom</span></label>
        </div>
        <div v-if="form.color && !isPresetColor && !store.customColors.some((entry) => entry.value === form.color)" class="inline-fields"><input v-model="customColorName" placeholder="Name this colour to reuse it" aria-label="Custom colour name" /><button type="button" class="button secondary" :disabled="!customColorName.trim()" @click="saveColor">Save colour</button></div>
        <small v-if="errors.color" class="field-error">{{ errors.color }}</small>
      </fieldset>

      <fieldset class="choice-field field-wide"><legend>Rating</legend><div class="preference-choices"><button v-for="option in PREFERENCES" :key="option.value" type="button" :class="{selected:form.preference===option.value}" :aria-pressed="form.preference===option.value" @click="form.preference=option.value"><span>{{ option.emoji }}</span>{{ option.label }}</button></div></fieldset>
      <fieldset class="choice-field field-wide"><legend>Seasons</legend><div class="category-choices"><button v-for="season in SEASONS" :key="season" type="button" :class="{selected:form.seasons.includes(season)}" :aria-pressed="form.seasons.includes(season)" @click="toggleChoice('seasons',season)">{{ season }}</button></div></fieldset>
      <fieldset class="choice-field field-wide"><legend>Occasions</legend><div class="category-choices"><button v-for="occasion in OCCASIONS" :key="occasion" type="button" :class="{selected:form.occasions.includes(occasion)}" :aria-pressed="form.occasions.includes(occasion)" @click="toggleChoice('occasions',occasion)">{{ occasion }}</button></div></fieldset>

      <label class="field"><span>Usage</span><select v-model="form.usageStatus"><option v-for="usage in store.usages" :key="usage.id" :value="usage.id">{{ usage.icon }} {{ usage.name }}</option></select><small v-if="errors.usageStatus" class="field-error">{{ errors.usageStatus }}</small></label>
      <label class="field"><span>Quantity</span><input v-model.number="form.quantity" type="number" min="1" inputmode="numeric" /><small v-if="errors.quantity" class="field-error">{{ errors.quantity }}</small></label>
      <label class="field"><span>Purchase date</span><input v-model="form.purchaseDate" type="date" /></label>
      <label class="field field-wide"><span>Notes</span><textarea v-model="form.notes" rows="3" placeholder="Fit, fabric, care instructions…"></textarea></label>
      <label class="field field-wide"><span>Product link</span><input v-model="form.productUrl" type="url" inputmode="url" placeholder="https://…" /></label>
      <div class="field field-wide"><button type="button" class="button ghost" :disabled="!form.productUrl || fetchingImage" @click="tryProductImage">{{ fetchingImage ? 'Looking for image…' : 'Try image from product link' }}</button><small class="form-help">Many stores block this. If it fails, use a photo instead.</small><small v-if="errors.productImage" class="field-error">{{ errors.productImage }}</small></div>
      <label class="check-field field-wide"><input v-model="form.markedForDisposal" type="checkbox" /><span>Mark for rehoming</span></label>
      <label v-if="form.markedForDisposal" class="field field-wide"><span>Rehoming reason *</span><textarea v-model="form.disposalReason" rows="2"></textarea><small v-if="errors.disposalReason" class="field-error">{{ errors.disposalReason }}</small></label>
    </div>

    <div class="form-actions sticky-actions" :class="{ adding: !editing }">
      <button type="button" class="button ghost cancel-button" @click="cancel">Cancel</button>
      <span class="spacer"></span>
      <button v-if="!editing" type="button" class="button secondary" :disabled="saving" @click="submit(true)"><span class="wide-label">Save & add another</span><span class="narrow-label">Add another</span></button>
      <button class="button primary" :disabled="saving">{{ saving ? 'Saving…' : editing ? 'Save changes' : 'Add item' }}</button>
    </div>
  </form>
</template>
