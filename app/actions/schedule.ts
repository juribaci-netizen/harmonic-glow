"use server"

import { seasonData } from "@/lib/season-data-2026-27"

/**
 * The work plan is currently sourced directly from the official season data.
 * Keeping it out of the database makes schedule updates immediately visible
 * and avoids stale/corrupted activity rows after plan changes.
 */
export async function getActivities() {
  return seasonData.map((a, index) => ({
    id: index + 1,
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

export async function seedSeason() {
  return { seeded: false, count: seasonData.length }
}
