import assert from 'node:assert/strict'
import {planWeekIp,countedHours,blockedTimes,overlaps} from '../lib/epc/ip-planning'
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
assert.deepEqual(planWeekIp(dates,[]).filter(e=>e.date===dates[0]).map(e=>[e.startTime,e.endTime]),[['08:00','12:00'],['14:00','18:00']])
assert.equal(range([])?.startTime,'08:00')
for(const rows of [[],[service],[morning,afternoon],[morning,evening],[{...service,status:'unconfirmed',hours:'0'}]]){
 const ips=planWeekIp(dates,rows)
 for(const date of dates){const day=ips.filter(e=>e.date===date);assert.ok(day.length<=2);for(let i=0;i<day.length;i++)for(let j=i+1;j<day.length;j++)assert.ok(day[i].endTime<=day[j].startTime||day[j].endTime<=day[i].startTime)}
 assert.ok(ips.every(e=>dates.includes(e.date)&&e.startTime>='08:00'&&e.endTime<='21:00'))
 for(const ip of ips)assert.equal(overlaps(timeMinutes(ip.startTime)!,timeMinutes(ip.endTime)!,blockedTimes(ip.date,rows)),false)
}
const manual={...service,id:2,type:'individual',status:'manual',startTime:'14:00',endTime:'17:00',hours:'3'}
assert.equal(range([manual]),undefined)
assert.equal(range([{...manual,status:'removed',hours:'0',startTime:null,endTime:null}]),undefined)
assert.equal(planWeekIp(dates,[{...service,hours:'42'}]).length,0)
assert.equal(range([{...service,startTime:null,endTime:null}]),undefined)
const daily=dates.slice(0,5).map((date,i)=>({...service,id:i+1,date}))
assert.equal(planWeekIp(dates,daily).reduce((n,e)=>n+Number(e.hours),0),18.5)
assert.ok(planWeekIp(dates,daily).every(e=>Number(e.hours)<=4))
const ip=(startTime:string,endTime:string):Entry=>({...manual,startTime,endTime})
assert.deepEqual(dayValues([ip('08:00','12:00')],dates[0]).ranges,['08:00-12:00',''])
assert.deepEqual(dayValues([ip('14:00','18:00')],dates[0]).ranges,['','14:00-18:00'])
const cross=['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06']
assert.ok(planWeekIp(cross,[]).every(e=>cross.includes(e.date)))
assert.equal(countedHours([service,{...service,id:2,type:'individual',hours:'4',status:'manual'},{...service,id:3,status:'unconfirmed',hours:'3'},{...service,id:4,status:'removed',hours:'3'},{...service,id:5,title:'Konkurz',hours:'3'},{...service,id:6,type:'off',hours:'8'}]),8)
assert.ok(planWeekIp(cross,[{...service,date:'2026-09-01',status:'present',hours:'4'}]).some(e=>e.date==='2026-08-31'))

const sum=(rows:ReturnType<typeof planWeekIp>)=>rows.reduce((n,e)=>n+Number(e.hours),0)
assert.equal(sum(planWeekIp(dates,[])),38.5)
const frozen=dates.slice(0,5).map((date,i)=>({...manual,id:i+100,date,hours:'6',startTime:'08:00',endTime:'14:00'}))
const snapshot=JSON.stringify(frozen)
const weekendPlan=planWeekIp(dates,frozen)
assert.equal(sum(weekendPlan),8.5)
assert.ok(weekendPlan.every(e=>dates.slice(5).includes(e.date)))
assert.equal(JSON.stringify(frozen),snapshot)
assert.equal(sum(planWeekIp(dates,[{...manual,hours:'38'}])),0.5)
assert.equal(sum(planWeekIp(dates,[{...manual,hours:'38.5'}])),0)
assert.equal(sum(planWeekIp(dates,[{...manual,hours:'39'}])),0)
const closed=dates.map((date,i)=>({...service,id:i+50,date,startTime:null,endTime:null,status:'unconfirmed',hours:'0'}))
assert.deepEqual(planWeekIp(dates,closed),[])
for(const rows of [[],daily,frozen,[morning,afternoon],[morning,evening]]){
 const plan=planWeekIp(dates,rows)
 assert.ok(countedHours(rows)+sum(plan)<=38.5)
 for(const date of dates){
  const day=plan.filter(e=>e.date===date)
  assert.ok(day.length<=2)
  assert.ok(countedHours(rows.filter(e=>e.date===date))+sum(day)<=8)
  for(const block of day)assert.equal(overlaps(timeMinutes(block.startTime)!,timeMinutes(block.endTime)!,blockedTimes(date,rows)),false)
 }
 assert.deepEqual(planWeekIp(dates,[...rows,...plan.map((p,i)=>({...p,id:1000+i,type:'individual',title:'IP',status:'auto',notes:null}))]),plan)
}
assert.equal(sum(planWeekIp(cross,[])),38.5)
const twoShort=[{...morning,endTime:'11:00',hours:'2'},{...evening,hours:'2'}]
const protectedDays=dates.slice(1,6).map((date,i)=>({...manual,id:200+i,date,hours:'6'}))
const protectedSunday={...manual,id:300,date:dates[6],status:'removed',hours:'0',startTime:null,endTime:null}
const serviceTopUp=planWeekIp(dates,[...twoShort,...protectedDays,protectedSunday])
assert.equal(sum(serviceTopUp),4.5)
assert.ok(serviceTopUp.length>=2)
assert.ok(serviceTopUp.some(e=>e.date!==dates[0]))
const distributed=planWeekIp(dates,[])
for(const date of dates)assert.ok(distributed.some(e=>e.date===date),'Every available day gets a first block before second blocks')
const future:Entry={...manual,date:'2027-01-04',status:'auto',startTime:'08:00',endTime:'12:00'}
const before={date:'2027-01-01',minutes:0}
assert.deepEqual(dayValues([future],future.date,before).ranges,['',''])
assert.deepEqual(dayValues([future],future.date,before,true).ranges,['08:00-12:00',''])
assert.deepEqual(dayValues([{...future,status:'removed'}],future.date,before,true).ranges,['',''])
const placeholder={...manual,date:dates[0],status:'unconfirmed',startTime:null,endTime:null,hours:'0'}
assert.deepEqual(planWeekIp(dates,[placeholder]),planWeekIp(dates,[]))
assert.deepEqual(dayValues([placeholder,{...future,date:dates[0]}],dates[0],before,true).ranges,['08:00-12:00',''])
const busyWeek=['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04']
const busyServices:Entry[]=[
 {...service,date:busyWeek[2],id:500},
 {...morning,date:busyWeek[3],id:501},
 {...afternoon,date:busyWeek[3],id:502},
 {...service,date:busyWeek[4],id:503},
 {...service,date:busyWeek[5],id:504,startTime:'10:00',endTime:'14:00'},
 {...service,date:busyWeek[6],id:505,startTime:'19:30',endTime:null,hours:'3'},
]
const busyPlan=planWeekIp(busyWeek,busyServices)
assert.ok(busyPlan.some(e=>e.date===busyWeek[0]))
assert.ok(busyPlan.some(e=>e.date===busyWeek[1]))
assert.equal(countedHours(busyServices)+sum(busyPlan),38.5)
const unconfirmedManual={...service,type:'manual-service',status:'unconfirmed',startTime:null,endTime:null,hours:'0',activityId:null}
assert.deepEqual(planWeekIp(dates,[unconfirmedManual]),planWeekIp(dates,[]))
const personal={weekdayStart:540,weekendStart:600,preferredEnd:1260,latestEnd:1320}
const personalPlan=planWeekIp(dates,[],personal)
assert.equal(sum(personalPlan),38.5)
assert.equal(personalPlan.find(e=>e.date===dates[0])?.startTime,'09:00')
assert.equal(personalPlan.find(e=>e.date===dates[5])?.startTime,'10:00')
for(const ip of personalPlan){
 const weekend=[0,6].includes(new Date(ip.date+'T12:00:00').getDay())
 assert.ok(ip.startTime>=(weekend?'10:00':'09:00'))
 assert.ok(ip.endTime<='21:00')
}
const protectedOtherDays=dates.slice(1).map((date,i)=>({...manual,id:700+i,date,hours:'6.083333333333333'}))
const lateBlocker={...service,id:800,date:dates[0],status:'unconfirmed',startTime:'09:00',endTime:'20:00',hours:'0'}
const latePlan=planWeekIp(dates,[...protectedOtherDays,...dates.slice(1).map((date,i)=>({...manual,id:900+i,date,status:'removed',hours:'0',startTime:null,endTime:null})),lateBlocker],personal)
assert.equal(sum(latePlan),2)
assert.equal(latePlan[0]?.startTime,'20:00')
assert.equal(latePlan[0]?.endTime,'22:00')
assert.ok(planWeekIp(dates,[],{...personal,preferredEnd:1200}).every(e=>e.endTime<='20:00'))
console.log('PASS: reference blocks, second daily blocks, weekend top-up, 38.5h target, half-hour remainder, manual preservation, blocked days, cross-month weeks, no overlaps and repeatable planning')
