import { ref } from 'vue'
import { db } from '../database/wardrobeDb'

const storedTheme = localStorage.getItem('my-wardrobe-theme')
export const theme = ref(storedTheme === 'light' ? 'light' : 'dark')

export function applyTheme(value = theme.value) {
  theme.value = value === 'light' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.value === 'dark' ? '#111612' : '#f5f6f2')
}

export async function setTheme(value) {
  applyTheme(value)
  localStorage.setItem('my-wardrobe-theme', theme.value)
  await db.settings.put({ key: 'theme', value: theme.value }).catch(() => {})
}

export function toggleTheme() {
  return setTheme(theme.value === 'dark' ? 'light' : 'dark')
}
