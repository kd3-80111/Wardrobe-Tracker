<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import { colorName, preferenceOption } from '../data/options'

const store = useWardrobeStore()
const route = useRoute()
const router = useRouter()
const item = computed(() => store.clothingById(route.params.id))
const categories = computed(() => store.categoriesFor(item.value))
const usage = computed(() => store.usageById(item.value?.usageStatus))
const label = (value) => String(value || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

onMounted(async () => { if (!store.initialized) await store.load().catch(() => {}) })
async function remove() {
  if (!item.value || !window.confirm(`Delete “${item.value.name}” permanently?`)) return
  await store.deleteClothing(item.value.id)
  router.replace('/wardrobe')
}
async function toggleRehome() {
  if (!item.value) return
  if (item.value.markedForDisposal) return store.setDisposal(item.value.id, false)
  const reason = window.prompt('Why are you rehoming this item?', item.value.disposalReason || '')
  if (reason === null) return
  if (!reason.trim()) return store.notify('Add a reason before rehoming')
  await store.setDisposal(item.value.id, true, reason.trim())
}
</script>

<template>
  <div v-if="store.loading && !store.initialized" class="loading-card">Loading item…</div>
  <div v-else-if="!item" class="empty-state"><h1>Item not found</h1><RouterLink class="button primary" to="/wardrobe">Back to wardrobe</RouterLink></div>
  <template v-else>
    <section class="detail-header">
      <div class="detail-image"><img v-if="item.photo" :src="item.photo" :alt="item.name" /><span v-else>{{ categories[0]?.icon || '◈' }}</span></div>
      <div class="detail-intro"><p class="eyebrow">{{ categories.map((category) => category.name).join(' · ') || 'Uncategorized' }}</p><h1>{{ item.name }}</h1><p>{{ usage?.icon }} {{ usage?.name || label(item.usageStatus) }}</p><div class="tag-row"><span class="tag">{{ preferenceOption(item.preference).emoji }} {{ preferenceOption(item.preference).label }}</span><span v-if="item.markedForDisposal" class="tag danger-tag">To rehome</span></div></div>
    </section>
    <div class="detail-actions"><RouterLink class="button primary" :to="`/clothing/${item.id}/edit`">Edit item</RouterLink><button class="button secondary" @click="toggleRehome">{{ item.markedForDisposal ? 'Keep item' : 'Rehome item' }}</button><button class="button danger" @click="remove">Delete</button></div>
    <section class="detail-card">
      <dl>
        <div><dt>Colour</dt><dd class="colour-value"><span v-if="item.color" :style="{background:item.color}"></span>{{ colorName(item.color) }}</dd></div><div><dt>Quantity</dt><dd>{{ item.quantity }}</dd></div>
        <div><dt>Usage</dt><dd>{{ usage?.icon }} {{ usage?.name || label(item.usageStatus) }}</dd></div><div><dt>Purchased</dt><dd>{{ item.purchaseDate || '—' }}</dd></div>
        <div class="wide-detail"><dt>Notes</dt><dd>{{ item.notes || '—' }}</dd></div>
        <div v-if="item.markedForDisposal" class="wide-detail"><dt>Rehoming reason</dt><dd>{{ item.disposalReason }}</dd></div>
      </dl>
    </section>
  </template>
</template>
