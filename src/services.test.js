import {describe,it,expect} from 'vitest'
import {backupPayload,validateBackup,visibleClothes,validateClothing,dashboardStats,seedRecordCount,mergeById} from './services'
const items=[{id:'1',name:'Blue shirt',categoryId:'a',categoryIds:['a','c'],categoryName:'Tops Layers',preference:'love',usageStatus:'regular',markedForDisposal:false,createdAt:'2025-01-01',updatedAt:'2025-01-01',color:'#4776a8',notes:''},{id:'2',name:'Black trousers',categoryId:'b',categoryIds:['b'],categoryName:'Bottomwear',preference:'dislike',usageStatus:'formal-only',markedForDisposal:true,createdAt:'2025-02-01',updatedAt:'2025-02-01',color:'#202124',notes:''}]
describe('wardrobe logic',()=>{
 it('creates one realistic demo item per category',()=>{expect(seedRecordCount).toBe(4)})
 it('validates required clothing fields',()=>{expect(validateClothing({}).name).toBeTruthy();expect(validateClothing({name:'Shirt',categoryIds:['a'],preference:'love',usageStatus:'regular',quantity:1})).toEqual({});expect(validateClothing({name:'x',categoryIds:['a'],preference:'love',usageStatus:'regular',quantity:1,markedForDisposal:true}).disposalReason).toBeTruthy()})
 it('filters and sorts visible clothing',()=>{expect(visibleClothes(items,{search:'blue'}).map(x=>x.id)).toEqual(['1']);expect(visibleClothes(items,{category:'c'}).map(x=>x.id)).toEqual(['1']);expect(visibleClothes(items,{disposal:'yes'}).map(x=>x.id)).toEqual(['2']);expect(visibleClothes(items,{sort:'name'}).map(x=>x.name)).toEqual(['Black trousers','Blue shirt'])})
 it('calculates dashboard totals from records',()=>{expect(dashboardStats(items,[{},{}])).toEqual({total:2,categories:2,loved:1,disposal:1,preference:{love:1,like:0,neutral:0,dislike:1,hate:0}})})
 it('validates and exports portable backup structure',()=>{const b=backupPayload([{id:'c',name:'Tops'}],[{id:'a',name:'Shirt',categoryId:'c',photo:'data:image/png;base64,AA=='}],[]);expect(validateBackup(b)).toBe(true);expect(b.clothing[0].photo).toContain('base64');expect(validateBackup({app:'other',categories:[],clothing:[]})).toBe(false)})
 it('merges without duplicating record ids and lets imported records update matches',()=>{const result=mergeById(items,[{...items[0],name:'Updated'}]);expect(result).toHaveLength(2);expect(result.find(x=>x.id==='1').name).toBe('Updated')})
})

