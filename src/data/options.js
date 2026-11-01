export const PREFERENCES = [
  { value: 'love', label: 'Love', emoji: '😍' },
  { value: 'like', label: 'Like', emoji: '👍' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'dislike', label: 'Dislike', emoji: '👎' },
  { value: 'hate', label: 'Hate', emoji: '😣' },
]

export const CATEGORY_ICONS = ['👕', '👔', '👚', '👖', '🩳', '🧥', '👗', '🥻', '👟', '👜', '🧢', '🧣', '🧦', '⌚', '💍', '◈']

export const COLOR_OPTIONS = [
  { label: 'Black', value: '#202124' }, { label: 'White', value: '#f4f3ee' },
  { label: 'Grey', value: '#8a8f8b' }, { label: 'Brown', value: '#795548' },
  { label: 'Beige', value: '#d7c6a5' }, { label: 'Red', value: '#c94b4b' },
  { label: 'Orange', value: '#dc7b42' }, { label: 'Yellow', value: '#d4ad3c' },
  { label: 'Green', value: '#4f8060' }, { label: 'Blue', value: '#4776a8' },
  { label: 'Navy', value: '#293d67' }, { label: 'Purple', value: '#76558e' },
  { label: 'Pink', value: '#cf7892' }, { label: 'Teal', value: '#3f8582' },
  { label: 'Sage', value: '#789584' },
]

export const DEFAULT_USAGES = [
  { id: 'regular', name: 'Regular', icon: '↻', color: '#4f8060' },
  { id: 'occasional', name: 'Occasional', icon: '◷', color: '#4776a8' },
  { id: 'formal-only', name: 'Formal only', icon: '◆', color: '#76558e' },
  { id: 'restricted', name: 'Restricted', icon: '!', color: '#dc7b42' },
  { id: 'cannot-wear-outside', name: 'Cannot wear outside', icon: '⌂', color: '#8a8f8b' },
]

export function preferenceOption(value) {
  return PREFERENCES.find((option) => option.value === value) || PREFERENCES[2]
}

export function colorName(value) {
  return COLOR_OPTIONS.find((option) => option.value.toLowerCase() === String(value || '').toLowerCase())?.label || value || 'Unspecified'
}
