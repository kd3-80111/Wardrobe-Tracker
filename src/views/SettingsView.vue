<script setup>
import { onMounted, ref } from 'vue'
import { db } from '../database/wardrobeDb'
import { backupPayload, mergeById, validateBackup } from '../services'
import { useWardrobeStore } from '../stores/wardrobe'
import { setTheme, theme } from '../composables/theme'
import { relativeDay } from '../utils/dates'
import AppIcon from '../components/AppIcon.vue'

const store = useWardrobeStore()
const importFile = ref(null)
const importMode = ref('merge')
const message = ref('')
const error = ref('')
const persisted = ref(null)
const usage = ref('')

onMounted(async () => {
  persisted.value = await navigator.storage?.persisted?.().catch(() => null) ?? null
  const estimate = await navigator.storage?.estimate?.().catch(() => null)
  if (estimate?.usage) usage.value = `${(estimate.usage / 1024 / 1024).toFixed(1)} MB used`
})
async function requestPersistence() {
  persisted.value = await navigator.storage?.persist?.().catch(() => false) ?? false
  store.notify(persisted.value ? 'Storage protected' : 'Your browser declined. Keep regular backups.')
}

async function exportBackup() {
  error.value = ''
  const payload = backupPayload(store.categories, store.clothes, await db.settings.toArray(), store.usages, store.mainCategories, store.customColors)
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `my-wardrobe-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  const now = new Date().toISOString()
  await db.settings.put({ key: 'lastBackup', value: now })
  store.lastBackup = now
  message.value = 'Backup downloaded.'
}

async function restoreBackup() {
  error.value = ''
  message.value = ''
  try {
    const backup = JSON.parse(await importFile.value.text())
    if (!validateBackup(backup)) throw new Error('This is not a valid My Wardrobe backup.')
    if (backup.schemaVersion < 4) throw new Error('This is an older backup. Its category mapping needs to be reviewed before restoring into the new wardrobe.')
    const replacing = importMode.value === 'replace'
    if (!window.confirm(`${replacing ? 'Replace your current wardrobe with' : 'Merge'} ${backup.clothing.length} items and ${backup.categories.length} categories?`)) return
    await db.transaction('rw', db.categories, db.clothing, db.settings, db.usages, db.mainCategories, db.customColors, async () => {
      if (replacing) { await db.categories.clear(); await db.clothing.clear(); await db.settings.clear(); await db.usages.clear(); await db.mainCategories.clear(); await db.customColors.clear() }
      const categories = mergeById(replacing ? [] : await db.categories.toArray(), backup.categories)
      const clothes = mergeById(replacing ? [] : await db.clothing.toArray(), backup.clothing)
      await db.categories.bulkPut(categories)
      await db.clothing.bulkPut(clothes)
      await db.settings.bulkPut(backup.settings)
      if (backup.usages?.length) await db.usages.bulkPut(backup.usages)
      if (backup.mainCategories?.length) await db.mainCategories.bulkPut(backup.mainCategories)
      if (backup.customColors?.length) await db.customColors.bulkPut(backup.customColors)
    })
    await store.load()
    const restoredTheme = backup.settings.find((setting) => setting.key === 'theme')?.value
    if (restoredTheme) await setTheme(restoredTheme)
    message.value = `Restored ${backup.clothing.length} items and ${backup.categories.length} categories.`
  } catch (exception) {
    error.value = exception instanceof SyntaxError ? 'The selected file is not valid JSON.' : exception.message
  }
}
</script>

<template>
  <section class="page-heading simple-heading"><div><p class="eyebrow">Preferences</p><h1>Settings</h1><p>Appearance, backup, and local data.</p></div></section>
  <div v-if="message" class="alert alert-success">{{ message }}</div><div v-if="error" class="alert alert-danger">{{ error }}</div>

  <section class="settings-card"><div><h2>Appearance</h2><p>Dark is the default. Light is available when you prefer it.</p></div><div class="segmented" role="group" aria-label="Theme"><button :class="{active:theme==='dark'}" :aria-pressed="theme==='dark'" @click="setTheme('dark')">☾ Dark</button><button :class="{active:theme==='light'}" :aria-pressed="theme==='light'" @click="setTheme('light')">☀ Light</button></div></section>

  <section class="settings-card stacked"><div><h2>Backup</h2><p>Download all categories, items, settings, and photos as one JSON file.</p></div>
    <div class="backup-status" :class="{ due: !store.lastBackup }"><AppIcon name="shield" :size="18" /><span>{{ store.lastBackup ? `Last backup ${relativeDay(store.lastBackup)}` : 'No backup yet' }}<template v-if="usage"> · {{ usage }}</template></span></div>
    <button class="button primary" @click="exportBackup"><AppIcon name="download" :size="18" />Download backup</button></section>

  <section class="settings-card stacked"><div><h2>Restore</h2><p>Merge updates matching records by ID. Replace removes current local data first.</p></div><label class="field"><span>Backup file</span><input type="file" accept="application/json,.json" @change="importFile=$event.target.files?.[0]" /></label><label class="field"><span>Restore mode</span><select v-model="importMode"><option value="merge">Merge with current data</option><option value="replace">Replace current data</option></select></label><button class="button secondary" :disabled="!importFile" @click="restoreBackup">Restore backup</button></section>

  <section class="settings-card"><div><h2>Device storage</h2><p v-if="persisted">Protected. The browser won’t clear your wardrobe to free up space.</p><p v-else>Not protected yet. The browser may clear site data when space runs low or after long inactivity.</p></div><button v-if="persisted === false" class="button secondary" @click="requestPersistence">Protect storage</button><span v-else-if="persisted" class="tag ok-tag"><AppIcon name="check" :size="14" />Protected</span></section>
  <div class="alert alert-warning"><strong>Local storage only.</strong> Clearing browser data removes your wardrobe. Download backups regularly.</div>
</template>
