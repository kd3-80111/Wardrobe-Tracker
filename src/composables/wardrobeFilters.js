import { reactive, watch } from 'vue'

const defaults = { search: '', main: '', category: '', preference: '', usage: '', disposal: '', season: '', occasion: '', sort: 'updated' }
let saved = {}
try { saved = JSON.parse(localStorage.getItem('wardrobeFilters') || '{}') } catch { /* Ignore invalid saved filters. */ }
export const wardrobeFilters = reactive({ ...defaults, ...saved })
watch(wardrobeFilters, (value) => localStorage.setItem('wardrobeFilters', JSON.stringify(value)), { deep: true })
