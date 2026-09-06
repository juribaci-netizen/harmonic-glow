"use server"

import { db } from "@/lib/db"
import { activity } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { asc, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { seasonData } from "@/lib/season-data"

export async function getActivities() {
  await getUserId()
  return db.select().from(activity).orderBy(asc(activity.date), asc(activity.startTime))
}

export async function seedSeason() {
  await getUserId()
  const [{ value }] = await db.select({ value: count() }).from(activity)
  if (value > 0) return { seeded: false }

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
    })),
  )

  revalidatePath("/schedule")
  revalidatePath("/")
  return { seeded: true, count: seasonData.length }
}
