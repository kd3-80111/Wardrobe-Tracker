<script setup>
import { preferenceOption } from '../data/options'

defineProps({
  item: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  usage: { type: Object, default: null },
  selectionMode: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})
defineEmits(['view', 'select'])
</script>

<template>
  <article class="item-card" :class="{ 'selection-card': selectionMode, selected }">
    <label v-if="selectionMode" class="select-check" @click.stop>
      <input type="checkbox" :checked="selected" :aria-label="`Select ${item.name}`" @change="$emit('select')" />
    </label>
    <button class="item-main" :aria-label="selectionMode ? `Select ${item.name}` : `View ${item.name}`" @click="$emit(selectionMode ? 'select' : 'view')">
      <span class="item-image">
        <img v-if="item.photo" :src="item.photo" alt="" />
        <span v-else aria-hidden="true">{{ categories[0]?.icon || '◈' }}</span>
      </span>
      <span class="item-copy">
        <strong>{{ item.name }}</strong>
        <small>{{ categories.map((category) => category.name).join(' · ') || 'Uncategorized' }}</small>
        <span class="item-tags">
          <span class="preference-tag">{{ preferenceOption(item.preference).emoji }} {{ preferenceOption(item.preference).label }}</span>
          <span v-if="item.markedForDisposal" class="danger-tag">Rehome</span>
        </span>
      </span>
      <span aria-hidden="true" class="chevron">›</span>
    </button>
  </article>
</template>
