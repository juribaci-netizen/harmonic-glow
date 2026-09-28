import assert from 'node:assert/strict'
import { preparationRepairs } from '../lib/epc/preparation-repairs'
import { DEFAULT_PREPARATION_PREFERENCES } from '../lib/epc/preparation-preferences'
import type { Entry } from '../lib/epc/model'
const prefs={...DEFAULT_PREPARATION_PREFERENCES,weekdayStart:540,weekendStart:600}
const row:Entry={id:1,date:'2020-05-04',type:'individual',title:'IP',hours:'38',status:'manual',notes:null,startTime:'09:00',endTime:'11:00'}
const suggestions=preparationRepairs([row],2020,4,prefs)
const partial=suggestions.find(p=>p.weekStart==='2020-05-04')!
assert.equal(partial.hours,0.5)
assert.notEqual(partial.date,row.date)
assert.equal(preparationRepairs([{...row,hours:'38.5'}],2020,4,prefs).some(p=>p.weekStart==='2020-05-04'),false)
assert(suggestions.every(p=>p.startTime>='09:00'&&p.endTime<='21:00'))
assert.equal(row.hours,'38')
const cleared:Entry={...row,id:2,date:'2020-05-05',hours:'0',status:'removed',startTime:null,endTime:null}
const before=JSON.stringify(cleared)
preparationRepairs([row,cleared],2020,4,prefs)
assert.equal(JSON.stringify(cleared),before)
console.log('Preparation proposal checks passed')
