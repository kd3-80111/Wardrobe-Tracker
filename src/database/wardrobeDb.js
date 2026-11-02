import Dexie from 'dexie'
import { MAIN_CATEGORY_DEFAULTS } from '../data/options'
export const db = new Dexie('MyWardrobe')
db.version(1).stores({categories:'&id,name,sortOrder',clothing:'&id,name,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key'})
db.version(2).stores({categories:'&id,name,sortOrder',clothing:'&id,name,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key'}).upgrade(async tx=>{await tx.table('clothing').toCollection().modify(x=>{x.quantity=Math.max(1,Number(x.quantity)||1);x.updatedAt ||= new Date().toISOString()})})
db.version(3).stores({categories:'&id,name,sortOrder',clothing:'&id,name,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key'}).upgrade(async tx=>{await tx.table('categories').toCollection().modify(category=>{if(!category.icon||category.icon==='â—ˆ')category.icon='◈'})})
db.version(4).stores({categories:'&id,name,sortOrder',clothing:'&id,name,*categoryIds,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key',usages:'&id,name,sortOrder'}).upgrade(async tx=>{await tx.table('clothing').toCollection().modify(item=>{item.categoryIds=Array.isArray(item.categoryIds)&&item.categoryIds.length?item.categoryIds:item.categoryId?[item.categoryId]:[];item.categoryId=item.categoryIds[0]||''})})
db.version(5).stores({categories:'&id,name,sortOrder',clothing:'&id,name,*categoryIds,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key',usages:'&id,name,sortOrder'}).upgrade(async tx=>{const icons={Tops:'👕',Layers:'🧥','Knitwear & Sweatshirts':'👚',Bottomwear:'👖'};await tx.table('categories').toCollection().modify(category=>{if(icons[category.name]&&(!category.icon||category.icon==='◈'||category.icon==='â—ˆ'))category.icon=icons[category.name]})})
db.version(6).stores({categories:'&id,name,sortOrder',clothing:'&id,name,*categoryIds,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key',usages:'&id,name,sortOrder'}).upgrade(async tx=>{await tx.table('clothing').toCollection().modify(item=>{delete item.subcategory})})
db.version(7).stores({mainCategories:'&id,name,sortOrder',categories:'&id,parentId,name,sortOrder',clothing:'&id,name,categoryId,preference,usageStatus,markedForDisposal,updatedAt',settings:'&key',usages:'&id,name,sortOrder',customColors:'&id,name,value'}).upgrade(async tx=>{
  const now = new Date().toISOString()
  await tx.table('mainCategories').bulkPut(MAIN_CATEGORY_DEFAULTS.map((entry, sortOrder) => ({ id: entry.id, name: entry.name, icon: entry.icon, sortOrder, createdAt: now, updatedAt: now })))
  const legacy = await tx.table('categories').toArray()
  const parentFor = (name) => /bottom|jean|chino|pant|trouser|short/i.test(name) ? 'bottoms' : /layer|jacket|coat|outer/i.test(name) ? 'outerwear' : /shoe|sneaker|footwear|sandal/i.test(name) ? 'footwear' : /watch|belt|cap|perfume|fragrance|accessor/i.test(name) ? 'accessories' : /sleep|night|pyjama/i.test(name) ? 'sleepwear' : 'tops'
  await tx.table('categories').bulkPut(legacy.map((entry) => ({ ...entry, parentId: parentFor(entry.name) })))
  await tx.table('clothing').toCollection().modify((item) => {
    item.categoryId = item.categoryIds?.[0] || item.categoryId || ''
    delete item.categoryIds
    item.seasons ||= ['All seasons']
    item.occasions ||= []
    item.totalWears = Math.max(0, Number(item.totalWears) || 0)
    item.wearsSinceWash = Math.max(0, Number(item.wearsSinceWash) || 0)
    item.productUrl ||= ''
  })
})
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`
