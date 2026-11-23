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

export const REHOME_REASONS = ['Doesn’t fit', 'Worn out', 'Rarely wear it', 'No longer my style', 'Damaged']

// Wears since the last wash after which Home suggests washing an item.
export const WASH_REMINDER = 3

export function colorName(value) {
  return COLOR_OPTIONS.find((option) => option.value.toLowerCase() === String(value || '').toLowerCase())?.label || value || 'Unspecified'
}

// sRGB hex → CIE Lab, where straight-line distance tracks how different colours look.
function toLab(hex) {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722)
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

// Closest preset name for any hex colour, so "#3f6385" reads as "Blue".
export function nearestColorName(value) {
  if (!/^#[0-9a-f]{6}$/i.test(String(value || ''))) return ''
  const [l, a, b] = toLab(value)
  let best = null
  for (const option of COLOR_OPTIONS) {
    const [l2, a2, b2] = toLab(option.value)
    const distance = (l - l2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2
    if (!best || distance < best.distance) best = { label: option.label, distance }
  }
  return best.label
}

// Human-readable colour for an item: its saved name, a matching custom colour, the nearest preset, or ''.
export function itemColorLabel(item, customColors = []) {
  if (!item?.color) return ''
  return item.colorName || customColors.find((entry) => entry.value === item.color)?.name || nearestColorName(item.color) || colorName(item.color)
}
