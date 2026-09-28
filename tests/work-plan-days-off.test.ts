import assert from 'node:assert/strict'
import { isWorkPlanDayOff } from '../lib/work-plan-days-off'
import { dayValues,visible,type Entry } from '../lib/epc/model'
assert.equal(isWorkPlanDayOff('2026-09-13'),true)
assert.equal(isWorkPlanDayOff('2026-09-14'),false)
assert.equal(isWorkPlanDayOff('2040-01-01'),false)
const service:Entry={id:1,date:'2026-09-13',type:'manual-service',title:'Manuálne pridaná 1. služba',hours:'0',status:'manual',notes:'[epc-slot:service:1]',startTime:null,endTime:null}
const now={date:'2026-10-01',minutes:720}
assert.equal(visible(service,now),false)
assert.deepEqual(dayValues([service],service.date,now).services,[false,false])
assert.equal(visible({...service,date:'2026-09-14'},now),true)
const ip:Entry={...service,id:2,type:'individual',title:'Príprava',notes:null,startTime:'10:00',endTime:'14:00',hours:'4'}
assert.equal(visible(ip,now),true)
assert.equal(dayValues([service,ip],service.date,now).ranges[0],'10:00-14:00')
console.log('PDF days-off checks passed')
