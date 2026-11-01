<script setup>
import { preferenceOption, PREFERENCES } from '../data/options'

defineProps({
  item: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  usage: { type: Object, default: null },
})
defineEmits(['view', 'edit', 'delete', 'preference'])
</script>

<template>
  <article class="item-card">
    <button class="item-main" :aria-label="`View ${item.name}`" @click="$emit('view')">
      <span class="item-image">
        <img v-if="item.photo" :src="item.photo" alt="" />
        <span v-else aria-hidden="true">{{ categories[0]?.icon || '◈' }}</span>
      </span>
      <span class="item-copy">
        <strong>{{ item.name }}</strong>
        <small>{{ categories.map((category) => category.name).join(' · ') || 'Uncategorized' }}</small>
        <span class="item-tags">
          <span class="preference-tag">{{ preferenceOption(item.preference).emoji }} {{ preferenceOption(item.preference).label }}</span>
          <span v-if="usage">{{ usage.icon }} {{ usage.name }}</span>
          <span v-if="item.markedForDisposal" class="danger-tag">Rehome</span>
        </span>
      </span>
      <span v-if="item.color" class="item-color" :style="{ background: item.color }" aria-label="Item colour"></span>
      <span aria-hidden="true" class="chevron">›</span>
    </button>
    <div class="quick-preference">
      <label :for="`preference-${item.id}`">Preference</label>
      <select :id="`preference-${item.id}`" :value="item.preference" @change="$emit('preference', $event.target.value)">
        <option v-for="option in PREFERENCES" :key="option.value" :value="option.value">{{ option.emoji }} {{ option.label }}</option>
      </select>
    </div>
    <div class="item-actions" aria-label="Item actions">
      <button @click="$emit('view')">View</button>
      <button @click="$emit('edit')">Edit</button>
      <button class="danger-action" @click="$emit('delete')">Delete</button>
    </div>
  </article>
</template>
