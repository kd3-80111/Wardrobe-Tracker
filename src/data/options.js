export const PREFERENCES = [
  { value: 'love', label: 'Love it', emoji: '😍' },
  { value: 'like', label: 'Like it', emoji: '👍' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'dislike', label: 'Dislike it', emoji: '👎' },
  { value: 'hate', label: 'Hate it', emoji: '😣' },
]

export const CATEGORY_ICONS = ['👕', '👔', '👖', '🩳', '🧥', '👟', '⌚', '🧢', '🧦', '🕶️', '🧴', '🎒', '◈']

export const MAIN_CATEGORY_DEFAULTS = [
  { id: 'tops', name: 'Tops', icon: '👕', children: ['T-shirts', 'Shirts', 'Sweatshirts', 'Sweaters'] },
  { id: 'bottoms', name: 'Bottoms', icon: '👖', children: ['Jeans', 'Chinos', 'Trousers', 'Shorts'] },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥', children: ['Jackets', 'Coats', 'Hoodies'] },
  { id: 'sleepwear', name: 'Sleepwear', icon: '🌙', children: ['Sleep tops', 'Sleep bottoms'] },
  { id: 'accessories', name: 'Accessories', icon: '⌚', children: ['Watches', 'Belts', 'Caps', 'Fragrances', 'Other accessories'] },
  { id: 'footwear', name: 'Footwear', icon: '👟', children: ['Sneakers', 'Formal shoes', 'Sandals', 'Other footwear'] },
]

export const SEASONS = ['All seasons', 'Summer', 'Monsoon', 'Winter']
export const OCCASIONS = ['Home', 'Casual', 'Office', 'Gym', 'Formal', 'Special occasion']

export const COLOR_OPTIONS = [
  { label: 'Black', value: '#202124' }, { label: 'White', value: '#f4f3ee' },
  { label: 'Grey', value: '#8a8f8b' }, { label: 'Brown', value: '#795548' },
  { label: 'Beige', value: '#d7c6a5' }, { label: 'Red', value: '#c94b4b' },
  { label: 'Orange', value: '#dc7b42' }, { label: 'Yellow', value: '#d4ad3c' },
  { label: 'Green', value: '#4f8060' }, { label: 'Blue', value: '#4776a8' },
  { label: 'Navy', value: '#293d67' }, { label: 'Purple', value: '#76558e' },
  { label: 'Pink', value: '#cf7892' }, { label: 'Teal', value: '#3f8582' },
  { label: 'Sage', value: '#789584' }, { label: 'Off white', value: '#e8e2d5' },
  { label: 'Dark grey', value: '#45484b' }, { label: 'Charcoal', value: '#30343a' },
  { label: 'Cream', value: '#f1e6c9' }, { label: 'Olive', value: '#646b40' },
  { label: 'Khaki', value: '#a8986b' }, { label: 'Maroon', value: '#713d49' },
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
