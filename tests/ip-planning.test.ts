import assert from 'node:assert/strict'
import {planWeekIp,blockedTimes,overlaps} from '../lib/epc/ip-planning'
import {timeMinutes,assignedSlots,type Entry} from '../lib/epc/model'
const dates=['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-06','2026-06-07']
const service:Entry={id:1,date:dates[0],type:'rehearsal',title:'Skúška',startTime:'09:00',endTime:'13:00',hours:'4',status:'auto',notes:null}
let plan=planWeekIp(dates,[service])
assert.equal(plan.reduce((n,e)=>n+Number(e.hours),0),36)
for(const ip of plan)assert.equal(overlaps(timeMinutes(ip.startTime)!,timeMinutes(ip.endTime)!,blockedTimes(ip.date,[service])),false)
assert.equal(plan.filter(e=>e.date===dates[0]).some(e=>e.startTime==='10:00'),false)
plan=planWeekIp(dates,[{...service,status:'removed',hours:'0'}])
assert.equal(plan.reduce((n,e)=>n+Number(e.hours),0),40)
assert.equal(plan.find(e=>e.date===dates[0])?.startTime,'08:00')
const manual={...service,id:2,type:'individual',status:'manual',startTime:'14:00',endTime:'17:00',hours:'3'}
assert.equal(planWeekIp(dates,[service,manual]).some(e=>e.date===dates[0]),false)
assert.equal(planWeekIp(dates,[{...service,hours:'42'}]).length,0)
const cross=['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06']
assert.ok(planWeekIp(cross,[]).every(e=>cross.includes(e.date)))
console.log('IP: 40-hour totals, rehearsal conflicts, declined services, manual preservation and cross-month dates passed')

assert.deepEqual(assignedSlots([{...service,id:10,type:'individual',startTime:'13:00',endTime:'14:00'},{...service,id:11,type:'individual',startTime:'17:00',endTime:'19:00'}],'ip').map(e=>e?.startTime),['13:00','17:00'])
