import { defineStore } from 'pinia'
import { db, uid } from '../database/wardrobeDb'
import { seed, seedUsages } from '../services'

export const useWardrobeStore = defineStore('wardrobe', {
  state: () => ({ clothes: [], categories: [], usages: [], loading: false, initialized: false, error: '', toast: '' }),
  getters: {
    clothingById: (state) => (id) => state.clothes.find((item) => item.id === id),
    categoryById: (state) => (id) => state.categories.find((category) => category.id === id),
    categoriesFor: (state) => (item) => {
      const ids = item?.categoryIds?.length ? item.categoryIds : item?.categoryId ? [item.categoryId] : []
      return ids.map((id) => state.categories.find((category) => category.id === id)).filter(Boolean)
    },
    categoryCount: (state) => (id) => state.clothes.filter((item) => (item.categoryIds?.length ? item.categoryIds : [item.categoryId]).includes(id)).length,
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
        const [clothes, categories, usages] = await Promise.all([
          db.clothing.toArray(), db.categories.orderBy('sortOrder').toArray(), db.usages.orderBy('sortOrder').toArray(),
        ])
        this.clothes = clothes
        this.categories = categories
        this.usages = usages
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
      const categoryIds = [...new Set(values.categoryIds || [])]
      const record = {
        ...values, categoryIds, categoryId: categoryIds[0] || '', id: existing?.id || uid(), name: values.name.trim(),
        quantity: Math.max(1, Number(values.quantity) || 1), createdAt: existing?.createdAt || now, updatedAt: now,
      }
      delete record.subcategory
      await db.clothing.put(record)
      await this.load()
      this.notify(existing ? 'Item updated' : 'Item added')
      return record
    },
    async deleteClothing(id) { await db.clothing.delete(id); await this.load(); this.notify('Item deleted') },
    async setPreference(id, preference) {
      await db.clothing.update(id, { preference, updatedAt: new Date().toISOString() })
      await this.load()
      this.notify('Preference updated')
    },
    async setDisposal(id, marked, reason = '') {
      await db.clothing.update(id, { markedForDisposal: marked, disposalReason: marked ? reason : '', updatedAt: new Date().toISOString() })
      await this.load()
      this.notify(marked ? 'Moved to rehome list' : 'Removed from rehome list')
    },
    async saveCategory(values, existingId = null) {
      const normalized = values.name.trim().toLocaleLowerCase()
      if (this.categories.some((category) => category.id !== existingId && category.name.trim().toLocaleLowerCase() === normalized)) throw new Error('A category with that name already exists.')
      const now = new Date().toISOString()
      const existing = existingId ? await db.categories.get(existingId) : null
      await db.categories.put({ id: existing?.id || uid(), name: values.name.trim(), description: values.description?.trim() || '', color: values.color || '#789584', icon: values.icon || '◈', sortOrder: existing?.sortOrder ?? this.categories.length, createdAt: existing?.createdAt || now, updatedAt: now })
      await this.load(); this.notify(existing ? 'Category updated' : 'Category added')
    },
    async deleteCategory(id, moveToId = null) {
      const affected = this.clothes.filter((item) => (item.categoryIds?.length ? item.categoryIds : [item.categoryId]).includes(id))
      await db.transaction('rw', db.categories, db.clothing, async () => {
        if (affected.length && !moveToId) throw new Error('Choose a category for the affected items.')
        for (const item of affected) {
          const current = item.categoryIds?.length ? item.categoryIds : [item.categoryId]
          const categoryIds = [...new Set(current.map((categoryId) => categoryId === id ? moveToId : categoryId).filter(Boolean))]
          await db.clothing.update(item.id, { categoryIds, categoryId: categoryIds[0] || '', updatedAt: new Date().toISOString() })
        }
        await db.categories.delete(id)
      })
      await this.load(); this.notify('Category deleted')
    },
    async moveCategory(id, direction) { await this.reorder('categories', this.categories, id, direction) },
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
