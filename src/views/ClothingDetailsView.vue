<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { REHOME_REASONS, WASH_REMINDER, itemColorLabel, preferenceOption } from '../data/options'
import { relativeDay } from '../utils/dates'
import AppIcon from '../components/AppIcon.vue'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const item = computed(() => store.clothingById(route.params.id))
const categories = computed(() => store.categoriesFor(item.value))
const usage = computed(() => store.usageById(item.value?.usageStatus))
const mainCategory = computed(() => store.mainCategories.find((entry) => entry.id === categories.value[0]?.parentId))
const colourLabel = computed(() => itemColorLabel(item.value, store.customColors))
const label = (value) => String(value || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const rehoming = ref(false)
const rehomeReason = ref('')
const rehomePanel = ref(null)

onMounted(async () => { if (!store.initialized) await store.load().catch(() => {}) })

async function remove() {
  if (!item.value) return
  const id = item.value.id
  await router.replace('/wardrobe')
  await store.deleteClothing(id)
}
async function startRehome() {
  rehomeReason.value = item.value.disposalReason || ''
  rehoming.value = true
  await nextTick()
  rehomePanel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
async function confirmRehome() {
  if (!rehomeReason.value.trim()) return
  await store.setDisposal(item.value.id, true, rehomeReason.value.trim())
  rehoming.value = false
}
async function resetWears() {
  if (window.confirm('Reset both wear counts to zero?')) await store.resetWearCount(item.value.id)
}
</script>

<template>
  <div v-if="store.loading && !store.initialized" class="loading-card">Loading item…</div>
  <div v-else-if="!item" class="empty-state"><h1>Item not found</h1><p>It may have been deleted.</p><RouterLink class="button primary" to="/wardrobe">Back to wardrobe</RouterLink></div>
  <template v-else>
    <RouterLink class="back-link" to="/wardrobe"><AppIcon name="chevron" :size="16" class="flip" />Wardrobe</RouterLink>
    <section class="detail-header">
      <div class="detail-image"><img v-if="item.photo" :src="item.photo" :alt="item.name" /><span v-else aria-hidden="true">{{ categories[0]?.icon || '◈' }}</span></div>
      <div class="detail-intro">
        <p class="eyebrow">{{ [mainCategory?.name, categories[0]?.name || 'Uncategorized'].filter(Boolean).join(' · ') }}</p>
        <h1>{{ item.name }}</h1>
        <div class="tag-row">
          <span class="tag">{{ preferenceOption(item.preference).emoji }} {{ preferenceOption(item.preference).label }}</span>
          <span class="tag">{{ usage?.icon }} {{ usage?.name || label(item.usageStatus) }}</span>
          <span v-if="item.color" class="tag colour-tag"><i :style="{ background: item.color }"></i>{{ colourLabel }}</span>
          <span v-if="item.markedForDisposal" class="tag danger-tag">To rehome</span>
        </div>
        <div class="detail-actions"><RouterLink class="button primary" :to="`/clothing/${item.id}/edit`">Edit item</RouterLink><button v-if="item.markedForDisposal" class="button secondary" @click="store.setDisposal(item.id, false)">Keep item</button><button v-else class="button secondary" @click="startRehome">Rehome…</button><button class="button danger" @click="remove">Delete</button></div>
      </div>
    </section>

    <section v-if="rehoming" ref="rehomePanel" class="detail-card rehome-panel" aria-labelledby="rehome-title">
      <h2 id="rehome-title">Why let it go?</h2>
      <div class="category-choices"><button v-for="reason in REHOME_REASONS" :key="reason" type="button" :class="{ selected: rehomeReason === reason }" :aria-pressed="rehomeReason === reason" @click="rehomeReason = reason">{{ reason }}</button></div>
      <label class="field"><span>Reason</span><textarea v-model="rehomeReason" rows="2" placeholder="Pick one above or write your own"></textarea></label>
      <div class="form-actions"><button type="button" class="button ghost" @click="rehoming = false">Cancel</button><button type="button" class="button primary" :disabled="!rehomeReason.trim()" @click="confirmRehome">Add to rehome list</button></div>
    </section>

    <section class="detail-card wear-card">
      <div class="wear-stats">
        <div><strong>{{ item.totalWears || 0 }}</strong><span>total wears</span></div>
        <div :class="{ warn: (item.wearsSinceWash || 0) >= WASH_REMINDER }"><strong>{{ item.wearsSinceWash || 0 }}</strong><span>since wash</span></div>
        <div><strong class="small">{{ relativeDay(item.lastWornAt) }}</strong><span>last worn</span></div>
      </div>
      <p v-if="(item.wearsSinceWash || 0) >= WASH_REMINDER" class="wash-hint"><AppIcon name="drop" :size="16" />Worn {{ item.wearsSinceWash }} times since the last wash. Time for a wash?</p>
      <div class="button-row"><button class="button primary" @click="store.logWear(item.id)"><AppIcon name="check" :size="18" />Worn today</button><button class="button secondary" :disabled="!item.wearsSinceWash" @click="store.washItem(item.id)"><AppIcon name="drop" :size="18" />Washed</button><button class="button ghost" :disabled="!item.totalWears" @click="store.changeWear(item.id,-1,-1)">Undo wear</button><button class="button ghost" :disabled="!item.totalWears" @click="resetWears">Reset</button></div>
    </section>

    <section class="detail-card">
      <dl>
        <div><dt>Colour</dt><dd class="colour-value"><span v-if="item.color" :style="{background:item.color}"></span>{{ colourLabel || '—' }}</dd></div><div><dt>Quantity</dt><dd>{{ item.quantity }}</dd></div>
        <div><dt>Seasons</dt><dd>{{ item.seasons?.join(', ') || 'All seasons' }}</dd></div><div><dt>Occasions</dt><dd>{{ item.occasions?.join(', ') || '—' }}</dd></div>
        <div><dt>Purchased</dt><dd>{{ item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }}</dd></div><div><dt>Added</dt><dd>{{ relativeDay(item.createdAt) }}</dd></div>
        <div v-if="item.productUrl" class="wide-detail"><dt>Product</dt><dd><a :href="item.productUrl" target="_blank" rel="noopener noreferrer">Open product link ↗</a></dd></div>
        <div class="wide-detail"><dt>Notes</dt><dd>{{ item.notes || '—' }}</dd></div>
        <div v-if="item.markedForDisposal" class="wide-detail"><dt>Rehoming reason</dt><dd>{{ item.disposalReason }}</dd></div>
      </dl>
    </section>
  </template>
</template>
