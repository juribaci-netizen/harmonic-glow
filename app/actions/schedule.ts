"use server"

import { seasonData } from "@/lib/season-data-2026-27"
import { getUserId } from '@/lib/session'
import { readParticipation, writeParticipation } from '@/lib/schedule-participation'
import { revalidatePath } from 'next/cache'

/**
 * The work plan is currently sourced directly from the official season data.
 * Keeping it out of the database makes schedule updates immediately visible
 * and avoids stale/corrupted activity rows after plan changes.
 */
export async function getActivities() {
  const participation = await readParticipation(await getUserId())
  return seasonData.map((a, index) => ({
    id: index + 1,
    playing: participation.get(index + 1) ?? true,
    date: a.date,
    type: a.type,
    startTime: a.startTime,
    endTime: a.endTime,
    title: a.title,
    conductor: a.conductor,
    venue: a.venue,
    program: a.program,
    notes: a.notes ?? null,
  }))
}

export async function setActivityParticipation(activityId: number, playing: boolean) {
  await writeParticipation(await getUserId(), activityId, playing)
  revalidatePath('/schedule')
  revalidatePath('/timesheet')
  revalidatePath('/')
  return { ok: true }
}

export async function seedSeason() {
  return { seeded: false, count: seasonData.length }
}
