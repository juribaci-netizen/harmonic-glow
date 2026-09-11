"use server"

import { seasonData } from "@/lib/season-data-2026-27"
import { getUserId } from '@/lib/session'
import { readParticipationState, writeParticipation, writeProgramParticipation, ParticipationConflictError } from '@/lib/schedule-participation'
import { programByActivity } from '@/lib/work-programs'
import { revalidatePath } from 'next/cache'

/**
 * The work plan is currently sourced directly from the official season data.
 * Keeping it out of the database makes schedule updates immediately visible
 * and avoids stale/corrupted activity rows after plan changes.
 */
export async function getActivities() {
  const participation = await readParticipationState(await getUserId())
  return seasonData.map((a, index) => ({
    id: index + 1,
    playing: participation.activities.get(index+1)??null,
    participationOverride:participation.overrides.has(index+1),
    workProgram:programByActivity.has(index+1)?{...programByActivity.get(index+1)!,playing:participation.programs.get(programByActivity.get(index+1)!.id)??null}:null,
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

export async function setActivityParticipation(activityId: number, playing: boolean|null) {
  try{await writeParticipation(await getUserId(), activityId, playing)}catch(error){if(error instanceof ParticipationConflictError)return {ok:false,error:error.message};throw error}
  revalidatePath('/schedule')
  revalidatePath('/timesheet')
  revalidatePath('/')
  return { ok: true }
}

export async function seedSeason() {
  return { seeded: false, count: seasonData.length }
}

export async function setProgramParticipation(programId:string,playing:boolean|null) {
  try{await writeProgramParticipation(await getUserId(),programId,playing)}catch(error){if(error instanceof ParticipationConflictError)return {ok:false,error:error.message};throw error}
  revalidatePath("/schedule");revalidatePath("/timesheet");revalidatePath("/")
  return {ok:true}
}
