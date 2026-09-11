import { and, eq, sql } from 'drizzle-orm'
import { db, pool } from './db'
import { participationChoice, timeEntry } from './db/schema'
import { seasonData } from './season-data-2026-27'
import { canChooseParticipation, plannedHours, isAudition } from './work-plan'
import { programByActivity, workPrograms } from './work-programs'
import { isIp, isService, timeMinutes, automaticRange, type Entry } from './epc/model'

export type Participation = boolean|null
export type Choice = 'yes'|'no'|'unset'|'inherit'
export class ParticipationConflictError extends Error {
  constructor(message:string){super(message);this.name='ParticipationConflictError'}
}
type Database = Pick<typeof db,'select'|'insert'|'execute'>
let ready:Promise<unknown>|undefined
export async function ensureParticipationStore() {
  if(!ready)ready=pool.query(`CREATE TABLE IF NOT EXISTS participation_choice (
    user_id text NOT NULL, choice_key text NOT NULL, choice text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,choice_key)
  )`).catch(error=>{ready=undefined;throw error})
  await ready
}
const value=(choice:string|undefined):Participation=>choice==='yes'?true:choice==='no'?false:null
export async function readParticipationState(userId:string,database:Database=db) {
  await ensureParticipationStore()
  const choices=await database.select().from(participationChoice).where(eq(participationChoice.userId,userId))
  const rows=await database.select().from(timeEntry).where(eq(timeEntry.userId,userId))
  const saved=new Map(choices.map(row=>[row.key,row.choice]))
  const programs=new Map(workPrograms.map(program=>[program.id,value(saved.get('program:'+program.id))]))
  const activities=new Map<number,Participation>(),overrides=new Set<number>()
  for(const [id,program] of programByActivity){
    const own=saved.get('activity:'+id)
    // Older automatic entries were not a confirmation. Preserve only explicit
    // manual edits/removals or the old explicitly-created attendance records.
    const old=rows.find(row=>row.activityId===id)
    const legacy=old?.status==='manual'||old?.status==='present'?true:old?.status==='removed'?false:
      old?.notes==='Účasť zvolená v pláne práce.'&&old.status==='auto'?true:undefined
    if(own==='yes'||own==='no'){activities.set(id,value(own));overrides.add(id)}
    else if(own==='inherit')activities.set(id,programs.get(program.id)??null)
    else if(legacy!==undefined){activities.set(id,legacy);overrides.add(id)}
    else activities.set(id,programs.get(program.id)??null)
  }
  return {programs,activities,overrides}
}
export async function readParticipation(userId:string) {
  return (await readParticipationState(userId)).activities
}
export function applyParticipation<T extends Entry & {activityId?:number|null}>(entries:T[],participation:Map<number,Participation>,overrides=new Set<number>()):T[] {
  return entries.map(entry=>{
    if(isAudition(entry))return {...entry,status:'removed',hours:'0'}
    if(!isService(entry))return entry.status==='auto'&&!entry.startTime?{...entry,ipRange:automaticRange(entry,entries.filter(row=>row.date===entry.date))}:entry
    if(entry.activityId==null&&(entry.status==='manual'||entry.status==='present'))return entry
    const playing=entry.activityId==null?null:participation.get(entry.activityId)??null
    if(playing===true)return {...entry,status:entry.status==='manual'&&entry.activityId!=null&&overrides.has(entry.activityId)?'manual':'auto',hours:Number(entry.hours)>0?entry.hours:String(plannedHours(entry.startTime??null,entry.endTime??null))}
    return {...entry,status:playing===false?'removed':'unconfirmed',hours:'0'}
  })
}
async function assertNewParticipationFitsIp(database:Database,userId:string,activityIds:number[],before:Map<number,Participation>) {
  const after=await readParticipationState(userId,database)
  const newlyPlayed=activityIds.filter(id=>before.get(id)!==true&&after.activities.get(id)===true)
  if(!newlyPlayed.length)return
  const rows=await database.select().from(timeEntry).where(eq(timeEntry.userId,userId))
  const manualIp=rows.filter(row=>isIp(row)&&(row.status==='manual'||row.status==='present'))
  for(const id of newlyPlayed){
    // Keep both the published time and any explicitly recorded service time
    // protected. A missing ending is unknown, not a guessed service duration.
    const services=[seasonData[id-1],...rows.filter(row=>row.activityId===id)]
    for(const service of services){
      if(!service)continue
      const start=timeMinutes(service.startTime),end=timeMinutes(service.endTime)??1440
      if(start===null)continue
      const conflict=manualIp.find(ip=>{
        const ipStart=timeMinutes(ip.startTime),ipEnd=timeMinutes(ip.endTime)
        return ip.date===service.date&&ipStart!==null&&ipEnd!==null&&ipStart<end&&ipEnd>start
      })
      if(conflict){
        const date=service.date.split('-').reverse().join('.')
        const serviceTime=service.endTime?`${service.startTime}–${service.endTime}`:`od ${service.startTime}`
        throw new ParticipationConflictError(`Službu „${service.title}“ ${date} (${serviceTime}) nemožno označiť „Hrám“: prekrýva sa s ručne zadanou IP ${conflict.startTime}–${conflict.endTime}. Najprv upravte čas IP.`)
      }
    }
  }
}
async function storeParticipationOverride(database:Database,userId:string,activityId:number,choice:Choice) {
  await database.insert(participationChoice).values({userId,key:'activity:'+activityId,choice})
    .onConflictDoUpdate({target:[participationChoice.userId,participationChoice.key],set:{choice,updatedAt:new Date()}})
}
// Called within the caller's transaction, including direct X edits in EPČ.
export async function setParticipationOverride(database:Database,userId:string,activityId:number,choice:Choice) {
  const before=await readParticipationState(userId,database)
  await storeParticipationOverride(database,userId,activityId,choice)
  await assertNewParticipationFitsIp(database,userId,[activityId],before.activities)
}
export async function writeParticipation(userId:string,activityId:number,playing:Participation) {
  if(!Number.isInteger(activityId)||![true,false,null].includes(playing))throw new Error('Neplatná voľba služby.')
  const activity=seasonData[activityId-1]
  if(!activity||!canChooseParticipation(activity))throw new Error('Pre túto položku sa účasť nevyberá.')
  await ensureParticipationStore()
  await db.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':ip-planning'}))`)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':'+activity.date.slice(0,7)}))`)
    await setParticipationOverride(tx,userId,activityId,playing===null?'inherit':playing?'yes':'no')
  })
}
export async function writeProgramParticipation(userId:string,programId:string,playing:Participation) {
  const program=workPrograms.find(program=>program.id===programId)
  if(!program||![true,false,null].includes(playing))throw new Error('Neplatný koncertný program.')
  await ensureParticipationStore()
  await db.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':ip-planning'}))`)
    for(const month of [...new Set(program.activityIds.map(id=>seasonData[id-1].date.slice(0,7)))].sort())
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':'+month}))`)
    const before=await readParticipationState(userId,tx)
    const choice=playing===null?'unset':playing?'yes':'no'
    await tx.insert(participationChoice).values({userId,key:'program:'+programId,choice})
      .onConflictDoUpdate({target:[participationChoice.userId,participationChoice.key],set:{choice,updatedAt:new Date()}})
    // A program-wide choice applies to every service. Later individual changes
    // are exceptions; the old raw records remain intact for audit/history.
    for(const id of program.activityIds)await storeParticipationOverride(tx,userId,id,'inherit')
    await assertNewParticipationFitsIp(tx,userId,program.activityIds,before.activities)
  })
}
