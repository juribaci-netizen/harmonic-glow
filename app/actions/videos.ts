"use server"

import { db } from "@/lib/db"
import { concertVideo } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { count, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { concertVideoSeed } from "@/lib/season-data"

export async function getVideos() {
  await getUserId()
  return db.select().from(concertVideo).orderBy(desc(concertVideo.date))
}

export async function seedVideos() {
  await getUserId()
  const [{ value }] = await db.select({ value: count() }).from(concertVideo)
  if (value > 0) return { seeded: false }
  await db.insert(concertVideo).values(concertVideoSeed)
  revalidatePath("/videos")
  return { seeded: true }
}

export type VideoInput = {
  title: string
  date: string | null
  conductor: string | null
  venue: string | null
  description: string | null
  url: string | null
}

export async function addVideo(input: VideoInput) {
  await getUserId()
  await db.insert(concertVideo).values({
    title: input.title,
    date: input.date,
    conductor: input.conductor,
    venue: input.venue,
    description: input.description,
    url: input.url,
  })
  revalidatePath("/videos")
  return { ok: true }
}
