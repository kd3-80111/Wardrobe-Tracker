import { defineStore } from 'pinia'
import { db, uid } from '../database/wardrobeDb'
import { seed, seedUsages, seedTaxonomy } from '../services'

export const useWardrobeStore = defineStore('wardrobe', {
  state: () => ({ clothes: [], categories: [], mainCategories: [], customColors: [], usages: [], loading: false, initialized: false, error: '', toast: '' }),
  getters: {
    clothingById: (state) => (id) => state.clothes.find((item) => item.id === id),
    categoryById: (state) => (id) => state.categories.find((category) => category.id === id),
    categoriesFor: (state) => (item) => state.categories.filter((category) => category.id === item?.categoryId),
    categoryCount: (state) => (id) => state.clothes.filter((item) => item.categoryId === id).length,
    mainCategoryCount: (state) => (id) => state.clothes.filter((item) => state.categories.some((category) => category.id === item.categoryId && category.parentId === id)).length,
    usageById: (state) => (id) => state.usages.find((usage) => usage.id === id),
    usageCount: (state) => (id) => state.clothes.filter((item) => item.usageStatus === id).length,
  },
  actions: {
    async load() {
      if (this.loading) return
      this.loading = true
      this.error = ''
      try {
        await seed()
        await seedUsages()
        await seedTaxonomy()
        const [clothes, categories, usages, mainCategories, customColors] = await Promise.all([
          db.clothing.toArray(), db.categories.orderBy('sortOrder').toArray(), db.usages.orderBy('sortOrder').toArray(), db.mainCategories.orderBy('sortOrder').toArray(), db.customColors.toArray(),
        ])
        this.clothes = clothes
        this.categories = categories
        this.usages = usages
        this.mainCategories = mainCategories
        this.customColors = customColors
        this.initialized = true
      } catch (error) {
        this.error = 'Your local wardrobe could not be opened. Check this browser’s storage permissions.'
        throw error
      } finally { this.loading = false }
    },
    notify(message) {
      this.toast = message
      window.setTimeout(() => { if (this.toast === message) this.toast = '' }, 2800)
    },
    async saveClothing(values, existingId = null) {
      const now = new Date().toISOString()
      const existing = existingId ? await db.clothing.get(existingId) : null
      const record = {
        ...values, id: existing?.id || uid(), name: values.name.trim(),
        quantity: Math.max(1, Number(values.quantity) || 1), createdAt: existing?.createdAt || now, updatedAt: now,
      }
      delete record.subcategory
      delete record.categoryIds
      await db.clothing.put(record)
      await this.load()
      this.notify(existing ? 'Item updated' : 'Item added')
      return record
    },
    async deleteClothing(id) { await db.clothing.delete(id); await this.load(); this.notify('Item deleted') },
    async setPreference(id, preference) {
      await db.clothing.update(id, { preference, updatedAt: new Date().toISOString() })
      await this.load()
      this.notify('Rating updated')
    },
    async setDisposal(id, marked, reason = '') {
      await db.clothing.update(id, { markedForDisposal: marked, disposalReason: marked ? reason : '', updatedAt: new Date().toISOString() })
      await this.load()
      this.notify(marked ? 'Moved to rehome list' : 'Removed from rehome list')
    },
    async bulkUpdateClothing(ids, changes) {
      if (!ids.length) return
      const now = new Date().toISOString()
      await db.transaction('rw', db.clothing, async () => {
        for (const id of ids) {
          const update = { updatedAt: now }
          if (changes.preference) update.preference = changes.preference
          if (changes.usageStatus) update.usageStatus = changes.usageStatus
          if (changes.categoryId) {
            update.categoryId = changes.categoryId
          }
          await db.clothing.update(id, update)
        }
      })
      await this.load()
      this.notify(`${ids.length} item${ids.length === 1 ? '' : 's'} updated`)
    },
    async bulkDeleteClothing(ids) {
      if (!ids.length) return
      await db.clothing.bulkDelete(ids)
      await this.load()
      this.notify(`${ids.length} item${ids.length === 1 ? '' : 's'} deleted`)
    },
    async saveCategory(values, existingId = null) {
      const normalized = values.name.trim().toLocaleLowerCase()
      if (this.categories.some((category) => category.id !== existingId && category.parentId === values.parentId && category.name.trim().toLocaleLowerCase() === normalized)) throw new Error('A subcategory with that name already exists.')
      const now = new Date().toISOString()
      const existing = existingId ? await db.categories.get(existingId) : null
      await db.categories.put({ id: existing?.id || uid(), parentId: values.parentId, name: values.name.trim(), description: values.description?.trim() || '', color: values.color || '#789584', icon: values.icon || '◈', sortOrder: existing?.sortOrder ?? this.categories.length, createdAt: existing?.createdAt || now, updatedAt: now })
      await this.load(); this.notify(existing ? 'Category updated' : 'Category added')
    },
    async deleteCategory(id, moveToId = null) {
      const affected = this.clothes.filter((item) => item.categoryId === id)
      await db.transaction('rw', db.categories, db.clothing, async () => {
        if (affected.length && !moveToId) throw new Error('Choose a category for the affected items.')
        for (const item of affected) {
          await db.clothing.update(item.id, { categoryId: moveToId, updatedAt: new Date().toISOString() })
        }
        await db.categories.delete(id)
      })
      await this.load(); this.notify('Category deleted')
    },
    async moveCategory(id, direction) { await this.reorder('categories', this.categories, id, direction) },
    async saveMainCategory(values, existingId = null) {
      const name = values.name.trim()
      if (!name) throw new Error('Name is required.')
      if (this.mainCategories.some((entry) => entry.id !== existingId && entry.name.toLowerCase() === name.toLowerCase())) throw new Error('Main category already exists.')
      const now = new Date().toISOString(), existing = existingId ? await db.mainCategories.get(existingId) : null
      await db.mainCategories.put({ id: existing?.id || uid(), name, icon: values.icon || '◈', sortOrder: existing?.sortOrder ?? this.mainCategories.length, createdAt: existing?.createdAt || now, updatedAt: now })
      await this.load()
    },
    async deleteMainCategory(id, replacementId) {
      const children = this.categories.filter((entry) => entry.parentId === id)
      if (children.length && !replacementId) throw new Error('Choose another main category first.')
      await db.transaction('rw', db.mainCategories, db.categories, async () => {
        for (const child of children) await db.categories.update(child.id, { parentId: replacementId })
        await db.mainCategories.delete(id)
      })
      await this.load()
    },
    async saveCustomColor(name, value) {
      if (!name.trim()) throw new Error('Name your custom colour.')
      const existing = this.customColors.find((entry) => entry.name.toLowerCase() === name.trim().toLowerCase())
      await db.customColors.put({ id: existing?.id || uid(), name: name.trim(), value })
      await this.load()
    },
    async changeWear(id, totalDelta, sinceWashDelta) {
      await db.transaction('rw', db.clothing, async () => {
        const item = await db.clothing.get(id)
        if (!item) return
        await db.clothing.update(id, { totalWears: Math.max(0, (item.totalWears || 0) + totalDelta), wearsSinceWash: Math.max(0, (item.wearsSinceWash || 0) + sinceWashDelta) })
      })
      await this.load()
    },
    async washItem(id) { await db.clothing.update(id, { wearsSinceWash: 0 }); await this.load() },
    async resetWearCount(id) { await db.clothing.update(id, { totalWears: 0, wearsSinceWash: 0 }); await this.load() },
    async saveUsage(values, existingId = null) {
      const normalized = values.name.trim().toLocaleLowerCase()
      if (this.usages.some((usage) => usage.id !== existingId && usage.name.trim().toLocaleLowerCase() === normalized)) throw new Error('A usage with that name already exists.')
      const now = new Date().toISOString()
      const existing = existingId ? await db.usages.get(existingId) : null
      await db.usages.put({ id: existing?.id || uid(), name: values.name.trim(), description: values.description?.trim() || '', icon: values.icon || '◷', color: values.color || '#789584', sortOrder: existing?.sortOrder ?? this.usages.length, createdAt: existing?.createdAt || now, updatedAt: now })
      await this.load(); this.notify(existing ? 'Usage updated' : 'Usage added')
    },
    async deleteUsage(id, moveToId = null) {
      const count = this.usageCount(id)
      if (count && !moveToId) throw new Error('Choose a replacement usage first.')
      await db.transaction('rw', db.usages, db.clothing, async () => {
        if (count) await db.clothing.where('usageStatus').equals(id).modify({ usageStatus: moveToId, updatedAt: new Date().toISOString() })
        await db.usages.delete(id)
      })
      await this.load(); this.notify('Usage deleted')
    },
    async moveUsage(id, direction) { await this.reorder('usages', this.usages, id, direction) },
    async reorder(tableName, items, id, direction) {
      const ordered = [...items]
      const index = ordered.findIndex((item) => item.id === id), target = index + direction
      if (index < 0 || target < 0 || target >= ordered.length) return
      ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
      await db.transaction('rw', db[tableName], async () => { await Promise.all(ordered.map((item, sortOrder) => db[tableName].update(item.id, { sortOrder }))) })
      await this.load()
    },
  },
})
