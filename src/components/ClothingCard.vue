<script setup>
import { ref, watch } from 'vue'
import { preferenceOption } from '../data/options'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  item: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  usage: { type: Object, default: null },
  selectionMode: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  quickWear: { type: Boolean, default: false },
  meta: { type: String, default: '' },
})
defineEmits(['view', 'select', 'wear'])

// Brief pulse when a wear is logged so the tap feels acknowledged.
const bumped = ref(false)
watch(() => props.item.totalWears, (next, previous) => {
  if ((next || 0) <= (previous || 0)) return
  bumped.value = false
  requestAnimationFrame(() => { bumped.value = true })
})
</script>

<template>
  <article class="item-card" :class="{ 'selection-card': selectionMode, selected, bumped }" @animationend="bumped = false">
    <label v-if="selectionMode" class="select-check" @click.stop>
      <input type="checkbox" :checked="selected" :aria-label="`Select ${item.name}`" @change="$emit('select')" />
    </label>
    <button class="item-main" :aria-label="selectionMode ? `Select ${item.name}` : `View ${item.name}`" @click="$emit(selectionMode ? 'select' : 'view')">
      <span class="item-image">
        <img v-if="item.photo" :src="item.photo" alt="" loading="lazy" decoding="async" />
        <span v-else aria-hidden="true">{{ categories[0]?.icon || '◈' }}</span>
      </span>
      <span class="item-copy">
        <strong>{{ item.name }}</strong>
        <small><i v-if="item.color" class="item-color" :style="{ background: item.color }"></i><span>{{ meta || categories.map((category) => category.name).join(' · ') || 'Uncategorized' }}</span></small>
        <span class="item-tags">
          <span class="preference-tag">{{ preferenceOption(item.preference).emoji }} {{ preferenceOption(item.preference).label }}</span>
          <span v-if="item.totalWears" class="tag">Worn {{ item.totalWears }}×</span>
          <span v-if="item.markedForDisposal" class="danger-tag">Rehome</span>
        </span>
      </span>
      <AppIcon v-if="!quickWear || selectionMode" name="chevron" class="chevron" />
    </button>
    <button v-if="quickWear && !selectionMode" type="button" class="quick-wear" :aria-label="`Log a wear for ${item.name}`" @click="$emit('wear')">
      <AppIcon name="check" :size="19" /><span>Worn</span>
    </button>
  </article>
</template>
