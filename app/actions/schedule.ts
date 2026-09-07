"use server"

import { db } from "@/lib/db"
import { activity } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { asc, count, and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { seasonData } from "@/lib/season-data-2026-27"

async function syncOfficialSchedule() {
  const [{ value: currentVersion }] = await db
    .select({ value: count() })
    .from(activity)
    .where(and(eq(activity.date, "2026-09-04"), eq(activity.type, "off"), eq(activity.title, "Voľno")))

  if (currentVersion > 0) return false

  await db.delete(activity)
  await db.insert(activity).values(
    seasonData.map((a) => ({
      date: a.date,
      type: a.type,
      startTime: a.startTime,
      endTime: a.endTime,
      title: a.title,
      conductor: a.conductor,
      venue: a.venue,
      program: a.program,
      notes: a.notes ?? null,
    })),
  )

  return true
}

export async function getActivities() {
  await getUserId()
  await syncOfficialSchedule()
  return db.select().from(activity).orderBy(asc(activity.date), asc(activity.startTime))
}

export async function seedSeason() {
  await getUserId()
  const seeded = await syncOfficialSchedule()
  return { seeded, count: seeded ? seasonData.length : undefined }
}
