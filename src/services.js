import {db} from './database/wardrobeDb'
import {DEFAULT_USAGES, MAIN_CATEGORY_DEFAULTS, PREFERENCES} from './data/options'
const DEMO_SEED_VERSION=2
const categoriesSeed=[
  {id:'demo-category-tops',parentId:'tops',name:'T-shirts',description:'T-shirts and everyday tops.',color:'#d88b75',icon:'👕'},
  {id:'demo-category-layers',parentId:'outerwear',name:'Jackets',description:'Jackets and outer layers.',color:'#778b7c',icon:'🧥'},
  {id:'demo-category-knitwear',parentId:'tops',name:'Sweaters',description:'Sweaters and knitwear.',color:'#b18a58',icon:'👕'},
  {id:'demo-category-bottomwear',parentId:'bottoms',name:'Jeans',description:'Denim bottoms.',color:'#7184a3',icon:'👖'},
]
const rows=[
  {id:'demo-item-white-tshirt',name:'White Cotton T-shirt',categoryId:'demo-category-tops',color:'#f4f1e8',preference:'like',status:'regular',note:'A versatile everyday basic.'},
  {id:'demo-item-denim-jacket',name:'Navy Denim Jacket',categoryId:'demo-category-layers',color:'#263b57',preference:'love',status:'occasional',note:'A casual layer for cooler evenings.'},
  {id:'demo-item-grey-sweater',name:'Grey Crewneck Sweater',categoryId:'demo-category-knitwear',color:'#8b8e93',preference:'like',status:'regular',note:'Comfortable mid-weight knitwear.'},
  {id:'demo-item-blue-jeans',name:'Blue Straight-Leg Jeans',categoryId:'demo-category-bottomwear',color:'#3f6385',preference:'love',status:'regular',note:'Reliable everyday denim.'},
]
export const seedRecordCount=rows.length
export async function seed(){
  const seeded=Boolean((await db.settings.get('seeded'))?.value)
  const version=Number((await db.settings.get('seedVersion'))?.value||0)
  if(seeded&&version>=DEMO_SEED_VERSION)return
  const replaceLegacyDemo=!!seeded&&version<=1&&(await db.clothing.count())===80
  if(seeded&&!replaceLegacyDemo)return
  const now=new Date().toISOString()
  await db.transaction('rw',db.categories,db.clothing,db.settings,async()=>{
    if(replaceLegacyDemo){await db.clothing.clear();await db.categories.clear()}
    await db.categories.bulkPut(categoriesSeed.map((category,sortOrder)=>({...category,sortOrder,createdAt:now,updatedAt:now})))
    await db.clothing.bulkPut(rows.map(item=>({id:item.id,name:item.name,categoryId:item.categoryId,color:item.color,preference:item.preference,usageStatus:item.status,quantity:1,notes:item.note,purchaseDate:'',photo:'',photoType:'',markedForDisposal:false,disposalReason:'',seasons:['All seasons'],occasions:[],totalWears:0,wearsSinceWash:0,productUrl:'',createdAt:now,updatedAt:now})))
    await db.settings.put({key:'seeded',value:true})
    await db.settings.put({key:'seedVersion',value:DEMO_SEED_VERSION})
  })
}
export async function seedUsages(){if(await db.usages.count())return;const now=new Date().toISOString();await db.usages.bulkPut(DEFAULT_USAGES.map((usage,sortOrder)=>({...usage,sortOrder,description:'',createdAt:now,updatedAt:now})))}
export async function seedTaxonomy(){
  if((await db.settings.get('taxonomySeeded'))?.value)return
  const now=new Date().toISOString()
  for(const [sortOrder,main] of MAIN_CATEGORY_DEFAULTS.entries()){
    if(!await db.mainCategories.get(main.id))await db.mainCategories.put({id:main.id,name:main.name,icon:main.icon,sortOrder,createdAt:now,updatedAt:now})
    for(const [index,name] of main.children.entries()){
      const existing=await db.categories.where('parentId').equals(main.id).filter(category=>category.name.toLowerCase()===name.toLowerCase()).first()
      if(!existing){const icons={'T-shirts':'👕',Shirts:'👔',Sweatshirts:'👕',Sweaters:'🧶',Jeans:'👖',Chinos:'👖',Trousers:'👖',Shorts:'🩳',Jackets:'🧥',Coats:'🧥',Hoodies:'🧥',Watches:'⌚',Belts:'◈',Caps:'🧢',Fragrances:'🧴',Sneakers:'👟','Formal shoes':'👞',Sandals:'🩴'};await db.categories.put({id:`default-${main.id}-${name.toLowerCase().replaceAll(' ','-')}`,parentId:main.id,name,icon:icons[name]||main.icon,color:'#789584',description:'',sortOrder:index,createdAt:now,updatedAt:now})}
    }
  }
  await db.settings.put({key:'taxonomySeeded',value:true})
}
export async function photoData(file){if(!file.type.startsWith('image/'))throw Error('Choose an image file.');return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,1280/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const finish=blob=>{if(!blob)return reject(Error('This image could not be processed.'));const rd=new FileReader();rd.onload=()=>resolve({photo:rd.result,photoType:blob.type});rd.onerror=()=>reject(Error('Could not read image.'));rd.readAsDataURL(blob)};c.toBlob(blob=>blob?.type==='image/webp'?finish(blob):c.toBlob(finish,'image/jpeg',.84),'image/webp',.82)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('This image could not be opened.'))};img.src=url})}
export function backupPayload(categories,clothing,settings,usages=[],mainCategories=[],customColors=[]){return {app:'my-wardrobe',applicationVersion:'1.0.0',schemaVersion:4,exportDate:new Date().toISOString(),categories,clothing,settings,usages,mainCategories,customColors}}
export function mergeById(existing,incoming){return [...new Map([...existing,...incoming].map(record=>[record.id,record])).values()]}
export function validateBackup(x){return !!x&&x.app==='my-wardrobe'&&[1,2,3,4].includes(x.schemaVersion)&&Array.isArray(x.categories)&&Array.isArray(x.clothing)&&Array.isArray(x.settings)&&(x.schemaVersion<4||(Array.isArray(x.mainCategories)&&Array.isArray(x.customColors)&&x.categories.every(c=>x.mainCategories.some(main=>main.id===c.parentId))))&&x.categories.every(c=>c.id&&String(c.name||'').trim())&&x.clothing.every(c=>{const ids=Array.isArray(c.categoryIds)&&c.categoryIds.length?c.categoryIds:[c.categoryId];return c.id&&String(c.name||'').trim()&&ids.some(id=>x.categories.some(cat=>cat.id===id))})}
export function validateClothing(x){const errors={};if(!String(x.name||'').trim())errors.name='Name is required.';if(!x.categoryId)errors.categoryId='Choose a subcategory.';if(!['love','like','neutral','dislike','hate'].includes(x.preference))errors.preference='Choose a rating.';if(!x.usageStatus)errors.usageStatus='Choose a usage.';if(!Number.isInteger(Number(x.quantity))||Number(x.quantity)<1)errors.quantity='Quantity must be at least one.';if(x.markedForDisposal&&!String(x.disposalReason||'').trim())errors.disposalReason='Add a disposal reason.';return errors}
export function dashboardStats(clothing,categories){return {total:clothing.length,categories:categories.length,loved:clothing.filter(x=>x.preference==='love').length,disposal:clothing.filter(x=>x.markedForDisposal).length,preference:Object.fromEntries(['love','like','neutral','dislike','hate'].map(p=>[p,clothing.filter(x=>x.preference===p).length]))}}
const PREFERENCE_RANK=Object.fromEntries(PREFERENCES.map((option,index)=>[option.value,index]))
const preferenceRank=(item)=>PREFERENCE_RANK[item.preference]??PREFERENCES.length
const byName=(a,b)=>String(a.name).localeCompare(String(b.name))
const SORTS={
  name:byName,
  category:(a,b)=>String(a.categoryName).localeCompare(String(b.categoryName))||byName(a,b),
  preference:(a,b)=>preferenceRank(a)-preferenceRank(b)||byName(a,b),
  added:(a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)),
  worn:(a,b)=>(b.totalWears||0)-(a.totalWears||0)||byName(a,b),
  // Never-worn items first, then the ones worn longest ago.
  forgotten:(a,b)=>String(a.lastWornAt||'').localeCompare(String(b.lastWornAt||''))||byName(a,b),
  updated:(a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)),
}
export function visibleClothes(items,{search='',category='',preference='',usage='',disposal='',sort='updated'}={}){
  const q=search.trim().toLowerCase()
  const matches=(x)=>[x.name,x.categoryName,x.colorLabel,x.notes,...(x.occasions||[])].some(v=>String(v||'').toLowerCase().includes(q))
  return items
    .filter(x=>!q||matches(x))
    .filter(x=>!category||x.categoryId===category)
    .filter(x=>!preference||x.preference===preference)
    .filter(x=>!usage||x.usageStatus===usage)
    .filter(x=>!disposal||(disposal==='yes'?x.markedForDisposal:!x.markedForDisposal))
    .sort(SORTS[sort]||SORTS.updated)
}
