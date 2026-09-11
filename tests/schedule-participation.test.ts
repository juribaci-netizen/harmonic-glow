import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { readParticipationState,writeParticipation,writeProgramParticipation,setParticipationOverride,applyParticipation,ensureParticipationStore,ParticipationConflictError } from '../lib/schedule-participation'
import { db,pool } from '../lib/db'
import { timeEntry,participationChoice } from '../lib/db/schema'
import { dayValues } from '../lib/epc/model'
import { programByActivity,workPrograms } from '../lib/work-programs'
import { seasonData } from '../lib/season-data-2026-27'
async function verifyManualIpGuard(userId:string){
 const activityId=(date:string,type:string)=>seasonData.findIndex(a=>a.date===date&&a.type===type)+1
 const rehearsal=activityId('2026-09-19','rehearsal'),dress=activityId('2026-09-23','dress'),concert=activityId('2026-09-23','concert')
 const program=programByActivity.get(rehearsal)!.id
 const choices=()=>db.select().from(participationChoice).where(eq(participationChoice.userId,userId)).orderBy(participationChoice.key)
 const entries=()=>db.select().from(timeEntry).where(eq(timeEntry.userId,userId)).orderBy(timeEntry.id)
 const conflict=(error:unknown)=>error instanceof ParticipationConflictError&&/ručne zadanou IP/.test(error.message)
 try{
  const [ip]=await db.insert(timeEntry).values({userId,date:'2026-09-19',type:'individual',title:'Moja IP',hours:'1',status:'manual',startTime:'10:00',endTime:'11:00'}).returning({id:timeEntry.id})
  await assert.rejects(()=>writeParticipation(userId,rehearsal,true),conflict,'An unselected rehearsal cannot be enabled over manual IP')
  assert.equal((await readParticipationState(userId)).activities.get(rehearsal),null)
  await writeParticipation(userId,rehearsal,false)
  let savedChoices=await choices(),savedIp=await entries()
  await assert.rejects(()=>writeProgramParticipation(userId,program,true),conflict)
  assert.deepEqual(await choices(),savedChoices,'A conflicting program change must roll back every program/service choice')
  assert.deepEqual(await entries(),savedIp,'Rejected participation must not alter manual IP')
  await assert.rejects(()=>db.transaction(tx=>setParticipationOverride(tx,userId,rehearsal,'yes')),conflict,'A direct EPČ X edit must use the same guard')
  assert.deepEqual(await choices(),savedChoices)

  await db.update(timeEntry).set({startTime:'13:00',endTime:'14:00'}).where(eq(timeEntry.id,ip.id))
  await writeProgramParticipation(userId,program,true)
  assert.equal((await readParticipationState(userId)).activities.get(rehearsal),true,'IP may start exactly when rehearsal ends')
  // Existing inconsistent data must not prevent declining a service or unrelated
  // choices. Only a transition into playing introduces a new conflict.
  await db.update(timeEntry).set({startTime:'10:00',endTime:'11:00'}).where(eq(timeEntry.id,ip.id))
  await writeParticipation(userId,rehearsal,true)
  await writeParticipation(userId,rehearsal,false)
  savedChoices=await choices();savedIp=await entries()
  await assert.rejects(()=>writeParticipation(userId,rehearsal,null),conflict,'Inheriting a played program can re-enable a conflicting rehearsal')
  await assert.rejects(()=>writeProgramParticipation(userId,program,true),conflict,'Repeating program yes must guard cleared no exceptions')
  assert.deepEqual(await choices(),savedChoices)
  assert.deepEqual(await entries(),savedIp)
  await writeProgramParticipation(userId,program,false)
  await writeProgramParticipation(userId,program,null)
  assert.equal((await readParticipationState(userId)).activities.get(rehearsal),null)

  await db.update(timeEntry).set({date:'2026-09-23'}).where(eq(timeEntry.id,ip.id))
  await assert.rejects(()=>writeParticipation(userId,dress,true),conflict,'Dress rehearsals also protect manual IP')
  await db.update(timeEntry).set({startTime:'20:00',endTime:'21:00'}).where(eq(timeEntry.id,ip.id))
  await assert.rejects(()=>writeParticipation(userId,concert,true),conflict,'A concert with unknown end blocks the remainder of its day')
  await db.update(timeEntry).set({startTime:'18:30',endTime:'19:30'}).where(eq(timeEntry.id,ip.id))
  await writeParticipation(userId,concert,true)
  assert.equal((await readParticipationState(userId)).activities.get(concert),true,'IP may end exactly when a concert begins')

  await db.update(timeEntry).set({date:'2026-12-18',startTime:'10:00',endTime:'11:00'}).where(eq(timeEntry.id,ip.id))
  await writeParticipation(userId,activityId('2026-12-18','dress'),true)
  assert.equal((await readParticipationState(userId)).activities.get(activityId('2026-12-18','dress')),true,'Do not invent times for an untimed service')
  await db.insert(timeEntry).values(['auto','suggested','removed','unconfirmed'].map(status=>({userId,date:'2026-09-20',type:'ip',title:'IP',hours:'1',status,startTime:'10:00',endTime:'11:00'})))
  await writeParticipation(userId,activityId('2026-09-20','rehearsal'),true)
  await db.update(timeEntry).set({date:'2026-09-21',status:'present'}).where(eq(timeEntry.id,ip.id))
  await assert.rejects(()=>writeParticipation(userId,activityId('2026-09-21','rehearsal'),true),conflict,'Older confirmed IP also needs protection')
 }finally{
  await db.delete(participationChoice).where(eq(participationChoice.userId,userId))
  await db.delete(timeEntry).where(eq(timeEntry.userId,userId))
 }
}
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
  await verifyManualIpGuard(userId+'-ip-guard')
  console.log('PASS: unconfirmed old auto entries have no X; whole program yes/no/unset; future gating; service exception and inheritance; unchanged IP/storage; user isolation; cross-month/year groups; invalid input.')
  console.log('PASS: manual IP overlap guard for service, program and direct EPČ X; atomic rollback; inheritance; allowed Nehrám; exact time boundaries; unknown end/start; confirmed and inactive IP statuses.')
 }finally{await db.delete(participationChoice).where(eq(participationChoice.userId,userId));await db.delete(timeEntry).where(eq(timeEntry.userId,userId));await pool.end()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
