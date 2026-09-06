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

export async function logHours(input: LogHoursInput) {
  const userId = await getUserId()
  const hours = clampHours(Number(input.hours))

  // One entry per user per activity: replace if already logged.
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

export async function deleteEntry(id: number) {
  const userId = await getUserId()
  await db.delete(timeEntry).where(and(eq(timeEntry.id, id), eq(timeEntry.userId, userId)))
  revalidatePath("/timesheet")
  revalidatePath("/schedule")
  revalidatePath("/")
  return { ok: true }
}
