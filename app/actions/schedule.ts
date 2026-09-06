"use server"

import { db } from "@/lib/db"
import { activity } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { asc, count, and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { seasonData } from "@/lib/season-data-2026-27"

export async function getActivities() {
  await getUserId()
  return db.select().from(activity).orderBy(asc(activity.date), asc(activity.startTime))
}

export async function seedSeason() {
  await getUserId()

  // The previous build contained placeholder/mock activities. Detect that dataset
  // and replace it with the official SF work plan imported from the uploaded PDF.
  const [{ value: officialEntry }] = await db
    .select({ value: count() })
    .from(activity)
    .where(and(eq(activity.date, "2026-09-08"), eq(activity.type, "recording"), eq(activity.title, "Nahrávanie propagačného CD")))

  if (officialEntry > 0) return { seeded: false }

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

  revalidatePath("/schedule")
  revalidatePath("/")
  return { seeded: true, count: seasonData.length }
}
