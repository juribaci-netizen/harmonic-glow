"use server"

import { db } from "@/lib/db"
import { timeEntry } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { seasonData } from "@/lib/season-data-2026-27"

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
  return d.toISOString().slice(0, 10)
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
  const userId = await getUserId()
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const endDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`

  const existing = await db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), gte(timeEntry.date, monthStart), lte(timeEntry.date, monthEnd)))

  const byActivity = new Map(existing.filter(e => e.activityId != null).map(e => [e.activityId, e]))
  const monthActivities = seasonData
    .map((activity, index) => ({ ...activity, activityId: index + 1 }))
    .filter(activity => activity.date >= monthStart && activity.date <= monthEnd)
    .filter(activity => activity.type !== "off" && activity.type !== "ip")

  for (const activity of monthActivities) {
    const hours = scheduledHours(activity.startTime, activity.endTime)
    if (hours <= 0 || byActivity.has(activity.activityId)) continue
    await db.insert(timeEntry).values({
      userId,
      activityId: activity.activityId,
      date: activity.date,
      type: activity.type,
      title: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      hours: String(hours),
      status: "auto",
      notes: "Automaticky prevzaté z pracovného plánu SF.",
    })
  }

  const refreshed = await db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), gte(timeEntry.date, monthStart), lte(timeEntry.date, monthEnd)))

  const weeks = new Map<string, typeof refreshed>()
  for (const entry of refreshed) {
    const key = iso(weekStart(new Date(`${entry.date}T00:00:00`)))
    const list = weeks.get(key) ?? []
    list.push(entry)
    weeks.set(key, list)
  }

  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const key = iso(weekStart(d))
    if (!weeks.has(key)) weeks.set(key, [])
  }

  for (const [weekKey, weekEntries] of weeks) {
    const total = weekEntries
      .filter(e => e.status !== "suggested" && e.status !== "removed")
      .reduce((sum, e) => sum + Number(e.hours), 0)

    let missing = Math.max(0, 40 - total)
    if (missing < 0.5) continue

    const monday = new Date(`${weekKey}T00:00:00`)
    const dayHours = new Map<string, number>()
    for (const e of weekEntries) {
      if (e.status === "suggested" || e.status === "removed") continue
      dayHours.set(e.date, (dayHours.get(e.date) ?? 0) + Number(e.hours))
    }

    const candidates: { date: string; existing: number }[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      if (d.getFullYear() !== year || d.getMonth() !== month) continue
      const date = iso(d)
      const existingHours = dayHours.get(date) ?? 0
      if (existingHours >= 8) continue
      candidates.push({ date, existing: existingHours })
    }

    candidates.sort((a,b) => {
      const aHasWork = a.existing > 0 ? 0 : 1
      const bHasWork = b.existing > 0 ? 0 : 1
      return aHasWork - bHasWork || a.existing - b.existing || a.date.localeCompare(b.date)
    })

    for (const candidate of candidates) {
      if (missing < 0.5) break
      const existingAutoIp = weekEntries.find(e => e.date === candidate.date && e.type === "individual")
      if (existingAutoIp) continue
      const capacity = Math.min(3, 8 - candidate.existing)
      const hours = Math.min(capacity, Math.ceil(Math.min(missing, capacity) * 2) / 2)
      if (hours < 0.5) continue
      await db.insert(timeEntry).values({
        userId,
        activityId: null,
        date: candidate.date,
        type: "individual",
        title: "Individuálna príprava",
        startTime: null,
        endTime: null,
        hours: String(hours),
        status: "auto",
        notes: "Automaticky doplnené do pracovného fondu 40 h/týždeň.",
      })
      missing -= hours
    }
  }

  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}

export async function getTimeEntries() {
  const userId = await getUserId()
  return db.select().from(timeEntry).where(eq(timeEntry.userId, userId)).orderBy(desc(timeEntry.date))
}

export async function getMonthEntries(year: number, month: number) {
  const userId = await getUserId()
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const endDate = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`
  return db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), gte(timeEntry.date, start), lte(timeEntry.date, end)))
    .orderBy(desc(timeEntry.date))
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

export async function setManualService(date: string, slot: 1 | 2, present: boolean) {
  const userId = await getUserId()
  const dayEntries = await db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), eq(timeEntry.date, date)))

  const work = dayEntries
    .filter(e => e.type !== "individual" && e.type !== "ip")
    .sort((a,b) => String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")))

  const target = work[slot - 1]
  if (target) return setEntryPresent(target.id, present)

  if (!present) return { ok: true }

  await db.insert(timeEntry).values({
    userId,
    activityId: null,
    date,
    type: "manual-service",
    title: slot === 1 ? "Manuálne pridaná 1. služba" : "Manuálne pridaná 2. služba",
    startTime: null,
    endTime: null,
    hours: "0",
    status: "manual",
    notes: "Manuálne označená prítomnosť v EPČ.",
  })
  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}

export async function setManualIpTime(date: string, slot: 1 | 2, startTime: string | null, endTime: string | null) {
  const userId = await getUserId()
  const dayEntries = await db
    .select()
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), eq(timeEntry.date, date)))

  const ips = dayEntries
    .filter(e => e.type === "individual" || e.type === "ip")
    .sort((a,b) => String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")))

  const target = ips[slot - 1]
  const start = startTime?.trim() || null
  const end = endTime?.trim() || null

  if (!start && !end) {
    if (target) {
      await db.update(timeEntry)
        .set({ status: "removed", hours: "0", startTime: null, endTime: null, updatedAt: new Date() })
        .where(and(eq(timeEntry.id, target.id), eq(timeEntry.userId, userId)))
    }
    revalidatePath("/timesheet")
    revalidatePath("/")
    return { ok: true }
  }

  const hours = scheduledHours(start, end)
  if (target) {
    await db.update(timeEntry)
      .set({ startTime: start, endTime: end, hours: String(hours), status: "manual", updatedAt: new Date() })
      .where(and(eq(timeEntry.id, target.id), eq(timeEntry.userId, userId)))
  } else {
    await db.insert(timeEntry).values({
      userId,
      activityId: null,
      date,
      type: "individual",
      title: "Individuálna príprava",
      startTime: start,
      endTime: end,
      hours: String(hours),
      status: "manual",
      notes: "Manuálne upravené priamo v EPČ.",
    })
  }
  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}
