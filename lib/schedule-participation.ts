import { and, eq, sql } from 'drizzle-orm'
import { db } from './db'
import { timeEntry } from './db/schema'
import { seasonData } from './season-data-2026-27'
import { canChooseParticipation, plannedHours } from './work-plan'

export async function readParticipation(userId: string) {
  const rows = await db.select({ activityId: timeEntry.activityId, status: timeEntry.status }).from(timeEntry).where(eq(timeEntry.userId, userId))
  return new Map(rows.filter(row => row.activityId !== null).map(row => [row.activityId!, row.status !== 'removed' && row.status !== 'suggested']))
}

export async function writeParticipation(userId: string, activityId: number, playing: boolean) {
  if (!Number.isInteger(activityId) || typeof playing !== 'boolean') throw new Error('Neplatná voľba služby.')
  const activity = seasonData[activityId - 1]
  if (!activity || !canChooseParticipation(activity)) throw new Error('Pre túto položku sa účasť nevyberá.')
  await db.transaction(async tx => {
    // Share the monthly lock with automatic filling and manual EPC edits.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId + ':' + activity.date.slice(0, 7)}))`)
    const existing = await tx.select().from(timeEntry).where(and(eq(timeEntry.userId, userId), eq(timeEntry.activityId, activityId)))
    const values = {
      status: playing ? 'auto' : 'removed',
      hours: String(playing ? plannedHours(activity.startTime, activity.endTime) : 0),
      updatedAt: new Date(),
    }
    if (existing.length) {
      // Preserve the original times, notes and EPC column assignments.
      for (const entry of existing) await tx.update(timeEntry).set({ ...values, hours: String(playing ? plannedHours(entry.startTime, entry.endTime) : 0) })
        .where(and(eq(timeEntry.userId, userId), eq(timeEntry.id, entry.id)))
    } else {
      await tx.insert(timeEntry).values({ ...values, userId, activityId, date: activity.date, type: activity.type, title: activity.title,
        startTime: activity.startTime, endTime: activity.endTime, notes: 'Účasť zvolená v pláne práce.' })
    }
  })
}
