import { reactive, watch } from 'vue'

export const FILTER_DEFAULTS = Object.freeze({ search: '', main: '', category: '', preference: '', usage: '', disposal: '', season: '', occasion: '', sort: 'updated' })

let saved = {}
try { saved = JSON.parse(localStorage.getItem('wardrobeFilters') || '{}') } catch { /* Ignore invalid saved filters. */ }

// Search text is per-visit; the rest is remembered so the wardrobe opens the way it was left.
export const wardrobeFilters = reactive({ ...FILTER_DEFAULTS, ...saved, search: '' })

export function resetWardrobeFilters(overrides = {}) {
  Object.assign(wardrobeFilters, FILTER_DEFAULTS, overrides)
}

watch(wardrobeFilters, ({ search: _search, ...value }) => {
  try { localStorage.setItem('wardrobeFilters', JSON.stringify(value)) } catch { /* Storage unavailable. */ }
}, { deep: true })
