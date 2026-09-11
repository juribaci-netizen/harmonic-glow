import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { readParticipationState,writeParticipation,writeProgramParticipation,applyParticipation,ensureParticipationStore } from '../lib/schedule-participation'
import { db,pool } from '../lib/db'
import { timeEntry,participationChoice } from '../lib/db/schema'
import { dayValues } from '../lib/epc/model'
import { programByActivity,workPrograms } from '../lib/work-programs'
import { seasonData } from '../lib/season-data-2026-27'
async function main(){
 if(!process.env.DATABASE_URL?.includes('127.0.0.1:55439'))throw new Error('Requires isolated local test database.')
 const userId='program-test-'+Date.now(),date='2026-09-08',past={date:'2026-09-09',minutes:0}
 const ids=seasonData.map((a,i)=>({a,id:i+1})).filter(({a})=>a.date===date).map(({id})=>id)
 await ensureParticipationStore()
 try{
  await db.insert(timeEntry).values(ids.map(activityId=>{const a=seasonData[activityId-1];return {userId,activityId,date,type:a.type,title:a.title,startTime:a.startTime,endTime:a.endTime,hours:'3',status:'auto',notes:'Automaticky prevzaté z pracovného plánu SF.'}}))
  await db.insert(timeEntry).values({userId,date,type:'individual',title:'IP',hours:'2.5',status:'manual',startTime:'17:00',endTime:'19:30'})
  const raw=await db.select().from(timeEntry).where(eq(timeEntry.userId,userId))
  const rendered=async()=>applyParticipation(raw,(await readParticipationState(userId)).activities)
  const values=async()=>dayValues(await rendered(),date,past)
  assert.deepEqual((await values()).services,[false,false]);assert.deepEqual((await values()).ranges,['','17:00-19:30'])
  await writeProgramParticipation(userId,'cd-2026-09',true)
  assert.deepEqual((await values()).services,[true,true]);assert.deepEqual(dayValues(await rendered(),date,{date,minutes:660}).services,[false,false])
  await writeProgramParticipation(userId,'cd-2026-09',false)
  assert.deepEqual((await values()).services,[false,false]);assert.deepEqual((await values()).ranges,['','17:00-19:30'])
  await writeParticipation(userId,ids[1],true)
  assert.deepEqual((await values()).services,[false,true])
  await writeProgramParticipation(userId,'cd-2026-09',false)
  assert.deepEqual((await values()).services,[false,false],'Program no must reset earlier service exceptions')
  await writeParticipation(userId,ids[1],true)
  await writeParticipation(userId,ids[1],null)
  assert.deepEqual((await values()).services,[false,false])
  await writeProgramParticipation(userId,'cd-2026-09',null)
  assert.equal((await readParticipationState(userId)).activities.get(ids[0]),null)
  assert.equal((await readParticipationState(userId+'-other')).programs.get('cd-2026-09'),null)
  assert.deepEqual(await db.select().from(timeEntry).where(eq(timeEntry.userId,userId)),raw,'Choosing participation must not rewrite stored entries or IP')
  for(const [id,program] of programByActivity)if(['rehearsal','dress','concert'].includes(seasonData[id-1].type))assert.ok(!program.id.startsWith('service:'),'Ungrouped musical service '+id)
  const bellini=workPrograms.find(p=>p.id==='bellini-2026')!
  assert.ok(bellini.activityIds.some(id=>seasonData[id-1].date.startsWith('2026-09')));assert.ok(bellini.activityIds.some(id=>seasonData[id-1].date.startsWith('2026-10')))
  const newYear=workPrograms.find(p=>p.id==='novy-rok-2027')!;assert.ok(newYear.activityIds.some(id=>seasonData[id-1].date.startsWith('2027')))
  assert.ok(workPrograms.find(p=>p.id==='olos-2026-12')!.activityIds.every(id=>programByActivity.get(id)!.id!=='cd-2026-09'))
  await assert.rejects(()=>writeParticipation(userId,1,true));await assert.rejects(()=>writeProgramParticipation(userId,'missing',true))
  console.log('PASS: unconfirmed old auto entries have no X; whole program yes/no/unset; future gating; service exception and inheritance; unchanged IP/storage; user isolation; cross-month/year groups; invalid input.')
 }finally{await db.delete(participationChoice).where(eq(participationChoice.userId,userId));await db.delete(timeEntry).where(eq(timeEntry.userId,userId));await pool.end()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
