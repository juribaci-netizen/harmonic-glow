"use server"

import { db } from "@/lib/db"
import { timeEntry } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq, gte, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { assignedSlots, slotNote, validateDate, timeMinutes, validateMonth, type Slot } from "@/lib/epc/model"
import { planWeekIp, blockedTimes, overlaps, IP_START, IP_END } from '@/lib/epc/ip-planning'
import { seasonData } from "@/lib/season-data-2026-27"
import { canChooseParticipation } from '@/lib/work-plan'
import { ensureParticipationStore,readParticipationState,applyParticipation,setParticipationOverride } from '@/lib/schedule-participation'

export type LogHoursInput = {
  activityId?: number | null
  date: string
  type: string
  title: string
  startTime?: string | null
  endTime?: string | null
  hours: number
  status: string
  notes?: string | null
}

function clampHours(h: number) {
  if (!Number.isFinite(h) || h < 0) return 0
  return Math.min(h, 24)
}

function weekStart(date: Date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function scheduledHours(startTime: string | null, endTime: string | null) {
  if (!startTime) return 0
  if (!endTime) return 3
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const minutes = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, minutes / 60)
}

export async function autoFillMonthFromWorkPlan(year: number, month: number) {
  validateMonth(year,month)
  const userId = await getUserId()
  await ensureParticipationStore()
  return db.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':ip-planning'}))`)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':'+year+'-'+String(month+1).padStart(2,'0')}))`)
  const monthStart = iso(weekStart(new Date(year,month,1)))
  const endDay = new Date(year, month + 1, 0).getDate()
  const lastSunday=weekStart(new Date(year,month,endDay));lastSunday.setDate(lastSunday.getDate()+6)
  const monthEnd = iso(lastSunday)

  const existing = await tx
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), gte(timeEntry.date, monthStart), lte(timeEntry.date, monthEnd)))

  const byActivity = new Map(existing.filter(e => e.activityId != null).map(e => [e.activityId, e]))
  const monthActivities = seasonData
    .map((activity, index) => ({ ...activity, activityId: index + 1 }))
    .filter(activity => activity.date >= monthStart && activity.date <= monthEnd)
    .filter(canChooseParticipation)

  for (const activity of monthActivities) {
    const hours = scheduledHours(activity.startTime, activity.endTime)
    if (byActivity.has(activity.activityId)) continue
    await tx.insert(timeEntry).values({
      userId,
      activityId: activity.activityId,
      date: activity.date,
      type: activity.type,
      title: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      hours: String(hours),
      status: "unconfirmed",
      notes: "Automaticky prevzaté z pracovného plánu SF.",
    })
  }

  const refreshed = await tx
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), gte(timeEntry.date, monthStart), lte(timeEntry.date, monthEnd)))

  const participation=await readParticipationState(userId,tx)
  const effective=applyParticipation(refreshed,participation.activities,participation.overrides)
  // Replace only generated preparation; preserve all manual edits and removals.
  await tx.delete(timeEntry).where(and(eq(timeEntry.userId,userId),gte(timeEntry.date,monthStart),lte(timeEntry.date,monthEnd),eq(timeEntry.status,'auto'),sql`${timeEntry.type} IN ('individual','ip')`))
  const shortfalls:{weekStart:string;missingHours:number}[]=[]
  for(let monday=new Date(monthStart+'T12:00:00');iso(monday)<=monthEnd;monday.setDate(monday.getDate()+7)){
    const dates=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return iso(d)})
    const rows=effective.filter(e=>dates.includes(e.date))
    const planned=planWeekIp(dates,rows)
    const recorded=rows.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&!(['individual','ip'].includes(e.type)&&e.status==='auto')).reduce((n,e)=>n+Number(e.hours),0)
    const missing=Math.max(0,40-recorded-planned.reduce((n,e)=>n+Number(e.hours),0))
    if(missing>0)shortfalls.push({weekStart:dates[0],missingHours:Math.round(missing*100)/100})
    for(const ip of planned)await tx.insert(timeEntry).values({...ip,userId,activityId:null,type:'individual',title:'Individuálna príprava',status:'auto',notes:'Automaticky rozvrhnuté do 40 h/týždeň mimo hraných služieb.'})
  }

  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true, shortfalls }
  })
}

export async function getTimeEntries() {
  const userId = await getUserId()
  const [rows,state]=await Promise.all([db.select().from(timeEntry).where(eq(timeEntry.userId,userId)).orderBy(desc(timeEntry.date)),readParticipationState(userId)])
  return applyParticipation(rows,state.activities,state.overrides)
}

export async function getMonthEntries(year: number, month: number) {
  validateMonth(year,month)
  const userId = await getUserId()
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const endDate = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`
  const rows=await db.select().from(timeEntry).where(and(eq(timeEntry.userId,userId),gte(timeEntry.date,start),lte(timeEntry.date,end))).orderBy(desc(timeEntry.date))
  const state=await readParticipationState(userId)
  return applyParticipation(rows,state.activities,state.overrides)
}

/**
 * Creates clearly marked suggestions for individual preparation where a completed
 * working week is below the 40 h target. Suggestions never exceed 3 h/day or 8 h/day
 * total, are placed on weekdays with existing work, and are never silently treated
 * as confirmed worked time (status = "suggested").
 */
export async function suggestIndividualPreparation(year: number, month: number) {
  const userId = await getUserId()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const rangeStart = new Date(monthStart)
  rangeStart.setDate(rangeStart.getDate() - 7)
  const rangeEnd = new Date(monthEnd)
  rangeEnd.setDate(rangeEnd.getDate() + 7)

  const entries = await db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), gte(timeEntry.date, iso(rangeStart)), lte(timeEntry.date, iso(rangeEnd))))

  const byWeek = new Map<string, typeof entries>()
  for (const entry of entries) {
    const key = iso(weekStart(new Date(`${entry.date}T00:00:00`)))
    const list = byWeek.get(key) ?? []
    list.push(entry)
    byWeek.set(key, list)
  }

  let created = 0
  for (const [weekKey, weekEntries] of byWeek) {
    const monday = new Date(`${weekKey}T00:00:00`)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    // Never create suggestions for a week that has not finished yet.
    if (sunday > today) continue

    const confirmed = weekEntries.filter(e => e.status !== "suggested")
    const total = confirmed.reduce((sum, e) => sum + Number(e.hours), 0)
    const missing = Math.max(0, 40 - total)
    if (missing < 0.5) continue

    // Only suggest preparation in a week where there is already real work on the schedule.
    if (confirmed.length === 0) continue

    const days = new Map<string, number>()
    for (const e of confirmed) days.set(e.date, (days.get(e.date) ?? 0) + Number(e.hours))

    const candidates: { date: string; hours: number }[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      if (d < monthStart || d > monthEnd || d > today) continue
      const date = iso(d)
      const existing = days.get(date) ?? 0
      if (existing >= 8) continue
      candidates.push({ date, hours: existing })
    }
    candidates.sort((a, b) => a.hours - b.hours || a.date.localeCompare(b.date))

    let remaining = missing
    for (const candidate of candidates) {
      if (remaining < 0.5) break
      const existingSuggested = weekEntries.find(e => e.date === candidate.date && e.status === "suggested" && e.type === "individual")
      if (existingSuggested) continue
      const capacity = Math.min(3, 8 - candidate.hours)
      const hours = Math.min(capacity, Math.ceil(Math.min(remaining, capacity) * 2) / 2)
      if (hours < 0.5) continue
      await db.insert(timeEntry).values({
        userId,
        activityId: null,
        date: candidate.date,
        type: "individual",
        title: "Individuálna príprava · návrh",
        startTime: null,
        endTime: null,
        hours: String(hours),
        status: "suggested",
        notes: "Automatický návrh na doplnenie pracovného fondu do 40 h/týždeň. Potvrď iba ak príprava reálne prebehla.",
      })
      created++
      remaining -= hours
    }
  }

  if (created) {
    revalidatePath("/timesheet")
    revalidatePath("/schedule")
    revalidatePath("/")
  }
  return { ok: true, created }
}

export async function logHours(input: LogHoursInput) {
  const userId = await getUserId()
  const hours = clampHours(Number(input.hours))

  if (input.activityId) {
    const existing = await db
      .select({ id: timeEntry.id })
      .from(timeEntry)
      .where(and(eq(timeEntry.userId, userId), eq(timeEntry.activityId, input.activityId)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(timeEntry)
        .set({
          hours: String(hours),
          status: input.status,
          notes: input.notes ?? null,
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          updatedAt: new Date(),
        })
        .where(and(eq(timeEntry.id, existing[0].id), eq(timeEntry.userId, userId)))
      revalidatePath("/timesheet")
      revalidatePath("/schedule")
      revalidatePath("/")
      return { ok: true }
    }
  }

  await db.insert(timeEntry).values({
    userId,
    activityId: input.activityId ?? null,
    date: input.date,
    type: input.type,
    title: input.title,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    hours: String(hours),
    status: input.status,
    notes: input.notes ?? null,
  })

  revalidatePath("/timesheet")
  revalidatePath("/schedule")
  revalidatePath("/")
  return { ok: true }
}

export async function confirmSuggestedEntry(id: number) {
  const userId = await getUserId()
  await db.update(timeEntry).set({ status: "present", title: "Individuálna príprava", updatedAt: new Date() }).where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId), eq(timeEntry.status, "suggested")))
  revalidatePath("/timesheet")
  revalidatePath("/schedule")
  revalidatePath("/")
  return { ok: true }
}

export async function deleteEntry(id: number) {
  const userId = await getUserId()
  await db.delete(timeEntry).where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId)))
  revalidatePath("/timesheet")
  revalidatePath("/schedule")
  revalidatePath("/")
  return { ok: true }
}


export async function updateTimeEntryHours(id: number, hours: number) {
  const userId = await getUserId()
  const safeHours = clampHours(Number(hours))
  await db
    .update(timeEntry)
    .set({ hours: String(safeHours), updatedAt: new Date() })
    .where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId)))
  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}


export async function setEntryPresent(id: number, present: boolean) {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId)))
    .limit(1)
  if (!rows.length) return { ok: false }
  const entry = rows[0]
  const hours = present ? scheduledHours(entry.startTime, entry.endTime) : 0
  await db
    .update(timeEntry)
    .set({
      status: present ? "manual" : "removed",
      hours: String(hours),
      updatedAt: new Date(),
    })
    .where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId)))
  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}

export async function updateEntryTime(id: number, startTime: string | null, endTime: string | null) {
  const userId = await getUserId()
  const start = startTime?.trim() || null
  const end = endTime?.trim() || null
  const hours = scheduledHours(start, end)
  await db
    .update(timeEntry)
    .set({
      startTime: start,
      endTime: end,
      hours: String(hours),
      status: "manual",
      updatedAt: new Date(),
    })
    .where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId)))
  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}

async function saveEpcSlot(date:string,slot:Slot,kind:'service'|'ip',value:boolean|[string|null,string|null]) {
  validateDate(date)
  if(slot!==1&&slot!==2)throw new Error('Neplatný stĺpec.')
  const userId=await getUserId()
  await ensureParticipationStore()
  await db.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':ip-planning'}))`)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId+':'+date.slice(0,7)}))`)
    const rows=await tx.select().from(timeEntry).where(and(eq(timeEntry.userId,userId),eq(timeEntry.date,date)))
    if(kind==='ip'){
      const [start,end]=value as [string|null,string|null]
      const target=assignedSlots(rows,kind)[slot-1]
      const otherIp=rows.filter(e=>e.id!==target?.id&&(e.type==='individual'||e.type==='ip')&&!['removed','suggested'].includes(e.status)&&e.startTime&&e.endTime).map(e=>[timeMinutes(e.startTime)!,timeMinutes(e.endTime)!] as [number,number])
      const state=await readParticipationState(userId,tx)
      const effective=applyParticipation(rows,state.activities,state.overrides)
      if(start&&end&&overlaps(timeMinutes(start)!,timeMinutes(end)!,[...blockedTimes(date,effective),...otherIp]))throw new Error('IP sa nesmie prekrývať s položkou v pláne ani s iným časom IP.')
    }
    const slots=assignedSlots(rows,kind)
    // Tag both existing columns before changing times, so sorting cannot move a value.
    for(let i=0;i<2;i++)if(slots[i])await tx.update(timeEntry).set({notes:slotNote(slots[i]!.notes,kind,(i+1) as Slot)})
      .where(and(eq(timeEntry.id,slots[i]!.id),eq(timeEntry.userId,userId)))
    const target=slots[slot-1]
    const present=kind==='service'?Boolean(value):!!(value as [string|null,string|null])[0]
    if(kind==='service'&&target?.activityId)await setParticipationOverride(tx,userId,target.activityId,present?'yes':'no')
    const [start,end]=kind==='ip'?value as [string|null,string|null]:[target?.startTime??null,target?.endTime??null]
    const updates={startTime:start,endTime:end,hours:String(present?(kind==='ip'?scheduledHours(start,end):target?.status!=='removed'&&target?Number(target.hours):scheduledHours(start,end)):0),status:present?'manual':'removed',notes:slotNote(target?.notes??'Manuálna úprava EPČ.',kind,slot),updatedAt:new Date()}
    if(target)await tx.update(timeEntry).set(updates).where(and(eq(timeEntry.id,target.id),eq(timeEntry.userId,userId)))
    else await tx.insert(timeEntry).values({...updates,userId,date,activityId:null,type:kind==='ip'?'individual':'manual-service',title:kind==='ip'?'Individuálna príprava':`Manuálne pridaná ${slot}. služba`})
  })
  revalidatePath('/timesheet');revalidatePath('/schedule');revalidatePath('/')
  return {ok:true}
}
export async function setManualService(date:string,slot:Slot,present:boolean) {
  if(typeof present!=='boolean')throw new Error('Neplatná hodnota.')
  return saveEpcSlot(date,slot,'service',present)
}
export async function setManualIpTime(date:string,slot:Slot,startTime:string|null,endTime:string|null) {
  const start=startTime?.trim()||null,end=endTime?.trim()||null
  if(start||end){
    const s=timeMinutes(start),e=timeMinutes(end)
    if(s===null||e===null||e<=s)throw new Error('Zadajte čas od–do, napríklad 09:00-13:00.')
    if(s<IP_START||e>IP_END)throw new Error('IP je možné zapísať iba v čase 09:00–21:00.')
  }
  return saveEpcSlot(date,slot,'ip',[start,end])
}
