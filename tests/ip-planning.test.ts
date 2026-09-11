import assert from 'node:assert/strict'
import {planWeekIp,blockedTimes,overlaps} from '../lib/epc/ip-planning'
import {timeMinutes,dayValues,type Entry} from '../lib/epc/model'
const dates=['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-06','2026-06-07']
const service:Entry={id:1,date:dates[0],type:'rehearsal',title:'Skúška',startTime:'09:00',endTime:'13:00',hours:'4',status:'auto',notes:null}
const range=(entries:Entry[])=>planWeekIp(dates,entries).find(e=>e.date===dates[0])
assert.deepEqual(range([service]),{date:dates[0],startTime:'14:00',endTime:'18:00',hours:'4'})
const morning={...service,endTime:'12:00',hours:'3'},afternoon={...service,id:2,startTime:'13:30',endTime:'16:30',hours:'3'}
assert.deepEqual(range([morning,afternoon]),{date:dates[0],startTime:'17:00',endTime:'19:00',hours:'2'})
const evening={...afternoon,startTime:'19:00',endTime:'21:00',hours:'2'}
assert.deepEqual(range([morning,evening]),{date:dates[0],startTime:'14:00',endTime:'16:00',hours:'2'})
assert.deepEqual(range([afternoon]),{date:dates[0],startTime:'08:00',endTime:'12:00',hours:'4'})
assert.deepEqual(range([{...service,status:'removed',hours:'0'}]),range([]))
assert.deepEqual(planWeekIp(dates,[]).filter(e=>e.date===dates[0]).map(e=>[e.startTime,e.endTime]),[['08:00','10:00'],['14:00','16:00']])
assert.equal(range([])?.startTime,'08:00')
for(const rows of [[],[service],[morning,afternoon],[morning,evening],[{...service,status:'unconfirmed',hours:'0'}]]){
 const ips=planWeekIp(dates,rows)
 for(const date of dates.slice(0,5)){const day=ips.filter(e=>e.date===date);assert.ok(day.length<=2);for(let i=0;i<day.length;i++)for(let j=i+1;j<day.length;j++)assert.ok(day[i].endTime<=day[j].startTime||day[j].endTime<=day[i].startTime)}
 assert.ok(ips.every(e=>dates.slice(0,5).includes(e.date)&&e.startTime>='08:00'&&e.endTime<='21:00'))
 for(const ip of ips)assert.equal(overlaps(timeMinutes(ip.startTime)!,timeMinutes(ip.endTime)!,blockedTimes(ip.date,rows)),false)
}
const manual={...service,id:2,type:'individual',status:'manual',startTime:'14:00',endTime:'17:00',hours:'3'}
assert.equal(range([manual]),undefined)
assert.equal(range([{...manual,status:'removed',hours:'0',startTime:null,endTime:null}]),undefined)
assert.equal(planWeekIp(dates,[{...service,hours:'42'}]).length,0)
assert.equal(range([{...service,startTime:null,endTime:null}]),undefined)
const daily=dates.slice(0,5).map((date,i)=>({...service,id:i+1,date}))
assert.equal(planWeekIp(dates,daily).reduce((n,e)=>n+Number(e.hours),0),20)
assert.ok(planWeekIp(dates,daily).every(e=>e.hours==='4'))
const ip=(startTime:string,endTime:string):Entry=>({...manual,startTime,endTime})
assert.deepEqual(dayValues([ip('08:00','12:00')],dates[0]).ranges,['08:00-12:00',''])
assert.deepEqual(dayValues([ip('14:00','18:00')],dates[0]).ranges,['','14:00-18:00'])
const cross=['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06']
assert.ok(planWeekIp(cross,[]).every(e=>cross.slice(0,5).includes(e.date)))
console.log('PASS: June-style 4h/2h service-day IP and two short blocks without a service, correct columns, morning/evening services, no overlaps, weekdays, manual preservation and weekly cap')
