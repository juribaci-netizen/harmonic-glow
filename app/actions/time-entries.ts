"use server"

import { db } from "@/lib/db"
import { timeEntry } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"

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
