import assert from 'node:assert/strict'
import {planWeekIp,blockedTimes,overlaps} from '../lib/epc/ip-planning'
import {timeMinutes,assignedSlots,type Entry} from '../lib/epc/model'
const dates=['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-06','2026-06-07']
const service:Entry={id:1,date:dates[0],type:'rehearsal',title:'Skúška',startTime:'09:00',endTime:'13:00',hours:'4',status:'auto',notes:null}
let plan=planWeekIp(dates,[service])
assert.ok(plan.reduce((n,e)=>n+Number(e.hours),0)<=36)
for(const ip of plan)assert.equal(overlaps(timeMinutes(ip.startTime)!,timeMinutes(ip.endTime)!,blockedTimes(ip.date,[service])),false)
assert.equal(plan.filter(e=>e.date===dates[0]).some(e=>e.startTime==='10:00'),false)
plan=planWeekIp(dates,[{...service,status:'removed',hours:'0'}])
assert.equal(plan.reduce((n,e)=>n+Number(e.hours),0),30)
assert.equal(plan.find(e=>e.date===dates[0])?.startTime,'09:00')
const manual={...service,id:2,type:'individual',status:'manual',startTime:'14:00',endTime:'17:00',hours:'3'}
assert.equal(planWeekIp(dates,[service,manual]).some(e=>e.date===dates[0]),false)
assert.equal(planWeekIp(dates,[{...service,hours:'42'}]).length,0)
const cross=['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06']
assert.ok(planWeekIp(cross,[]).every(e=>cross.includes(e.date)))
console.log('IP: 40-hour totals, rehearsal conflicts, declined services, manual preservation and cross-month dates passed')

assert.deepEqual(assignedSlots([{...service,id:10,type:'individual',startTime:'13:00',endTime:'14:00'},{...service,id:11,type:'individual',startTime:'17:00',endTime:'19:00'}],'ip').map(e=>e?.startTime),['13:00','17:00'])

for(const ip of plan)assert.ok(ip.startTime>='09:00'&&ip.endTime<='21:00')
const late={...service,startTime:'09:00',endTime:'17:00',hours:'4'}
assert.ok(planWeekIp(dates,[late]).some(e=>e.date===dates[0]&&e.startTime==='17:00'&&e.endTime==='21:00'))
assert.equal(planWeekIp(dates,[{...service,startTime:null,endTime:null}]).some(e=>e.date===dates[0]),false)

for(const rows of [[],[service],[late],dates.slice(0,5).map((date,i)=>({...service,id:i+1,date}))]){
 const ips=planWeekIp(dates,rows)
 assert.ok(ips.filter(e=>Number(e.hours)>3).length<=1)
 for(const ip of ips.filter(e=>Number(e.hours)>3))assert.equal(ips.filter(e=>e.date===ip.date).length,1)
 assert.ok(ips.every(e=>Number(e.hours)<=4))
}
const dailyServices=dates.slice(0,5).map((date,i)=>({...service,id:i+1,date}))
assert.equal(planWeekIp(dates,dailyServices).reduce((n,e)=>n+Number(e.hours),0),20)
assert.ok(planWeekIp(dates,dailyServices).every(e=>Number(e.hours)===2))
