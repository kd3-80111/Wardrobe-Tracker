<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'
import ClothingCard from '../components/ClothingCard.vue'
import AppIcon from '../components/AppIcon.vue'
import { WASH_REMINDER } from '../data/options'
import { daysSince, relativeDay } from '../utils/dates'

const FORGOTTEN_AFTER_DAYS = 30
const BACKUP_REMINDER_DAYS = 14

const store = useWardrobeStore()
const router = useRouter()
const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

const active = computed(() => store.clothes.filter((item) => !item.markedForDisposal))
const forgottenAll = computed(() => active.value
  .filter((item) => daysSince(item.lastWornAt) >= FORGOTTEN_AFTER_DAYS)
  .sort((a, b) => String(a.lastWornAt || '').localeCompare(String(b.lastWornAt || '')) || (a.totalWears || 0) - (b.totalWears || 0)))
const forgotten = computed(() => forgottenAll.value.slice(0, 3))
const needsWash = computed(() => store.clothes.filter((item) => (item.wearsSinceWash || 0) >= WASH_REMINDER).sort((a, b) => b.wearsSinceWash - a.wearsSinceWash))
const recentlyWorn = computed(() => store.clothes.filter((item) => item.lastWornAt).sort((a, b) => b.lastWornAt.localeCompare(a.lastWornAt)).slice(0, 3))
const recentlyAdded = computed(() => [...store.clothes].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3))
const stats = computed(() => [
  { to: '/wardrobe', value: store.clothes.length, label: 'Items', icon: 'hanger' },
  { to: '/wardrobe?preference=love', value: store.clothes.filter((item) => item.preference === 'love').length, label: 'Favourites', icon: 'heart' },
  { to: '/wardrobe?sort=forgotten&disposal=no', value: forgottenAll.value.length, label: `Not worn in ${FORGOTTEN_AFTER_DAYS}+ days`, icon: 'clock' },
  { to: '/wardrobe?disposal=yes', value: store.clothes.filter((item) => item.markedForDisposal).length, label: 'To rehome', icon: 'recycle' },
])
const backupDue = computed(() => store.clothes.length > 0 && daysSince(store.lastBackup) >= BACKUP_REMINDER_DAYS)
const open = (item) => router.push(`/clothing/${item.id}`)
</script>

<template>
  <section class="page-heading">
    <div><p class="eyebrow">{{ today }}</p><h1>{{ greeting }}</h1><p>What are you wearing today?</p></div>
  </section>

  <div v-if="store.loading && !store.initialized" class="stat-grid" aria-busy="true"><div v-for="n in 4" :key="n" class="skeleton-card short"></div></div>
  <div v-else-if="!store.clothes.length" class="empty-state"><div class="empty-icon"><AppIcon name="hanger" :size="28" /></div><h2>Your wardrobe is empty</h2><p>Add your first piece. Use “Save & add another” to get through a whole drawer quickly.</p><RouterLink class="button primary" to="/clothing/add">Add item</RouterLink></div>
  <template v-else>
    <section class="stat-grid" aria-label="Wardrobe summary">
      <RouterLink v-for="stat in stats" :key="stat.label" :to="stat.to"><span class="stat-icon"><AppIcon :name="stat.icon" :size="18" /></span><strong>{{ stat.value }}</strong><span>{{ stat.label }}</span></RouterLink>
    </section>

    <RouterLink v-if="backupDue" to="/settings" class="nudge-card">
      <span class="nudge-icon"><AppIcon name="shield" :size="20" /></span>
      <span><strong>{{ store.lastBackup ? `Last backup ${relativeDay(store.lastBackup)}` : 'No backup yet' }}</strong><small>Your wardrobe lives only on this device. Download a backup to keep it safe.</small></span>
      <AppIcon name="chevron" :size="18" />
    </RouterLink>

    <section v-if="needsWash.length" class="section-block">
      <div class="section-heading"><h2>Needs a wash <small class="count">{{ needsWash.length }}</small></h2></div>
      <div class="mini-list">
        <div v-for="item in needsWash.slice(0, 4)" :key="item.id" class="mini-row">
          <button type="button" class="mini-main" @click="open(item)">
            <span class="mini-thumb"><img v-if="item.photo" :src="item.photo" alt="" loading="lazy" /><span v-else aria-hidden="true">{{ store.categoryById(item.categoryId)?.icon || '◈' }}</span></span>
            <span class="mini-copy"><strong>{{ item.name }}</strong><small>{{ item.wearsSinceWash }} wears since wash</small></span>
          </button>
          <button type="button" class="button secondary small" @click="store.washItem(item.id)"><AppIcon name="drop" :size="16" />Washed</button>
        </div>
      </div>
    </section>

    <section v-if="forgotten.length" class="section-block">
      <div class="section-heading"><div><h2>Give these some love</h2><p class="section-sub">Not worn in a while. Tap “Worn” when you wear one.</p></div><RouterLink to="/wardrobe?sort=forgotten&disposal=no">See all</RouterLink></div>
      <div class="card-list compact-list">
        <ClothingCard v-for="item in forgotten" :key="item.id" :item="item" :categories="store.categoriesFor(item)" :meta="item.lastWornAt ? `Last worn ${relativeDay(item.lastWornAt)}` : 'Not worn yet'" quick-wear @view="open(item)" @wear="store.logWear(item.id)" />
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading"><h2>{{ recentlyWorn.length ? 'Recently worn' : 'Recently added' }}</h2><RouterLink to="/wardrobe">View all</RouterLink></div>
      <div class="card-list compact-list">
        <ClothingCard v-for="item in (recentlyWorn.length ? recentlyWorn : recentlyAdded)" :key="item.id" :item="item" :categories="store.categoriesFor(item)" :meta="item.lastWornAt ? `Worn ${relativeDay(item.lastWornAt)}` : ''" quick-wear @view="open(item)" @wear="store.logWear(item.id)" />
      </div>
    </section>
  </template>
</template>
