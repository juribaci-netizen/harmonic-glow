import type { SeasonActivity } from './season-data-2026-27'

export const isAudition = (activity: {title:string;type?:string}) => activity.type!=='individual' && activity.type!=='ip' && /konkurz/i.test(activity.title)

export function canChooseParticipation(activity: Pick<SeasonActivity, 'type' | 'startTime' | 'title' | 'notes'>) {
  return !isAudition(activity) && activity.type !== 'off' && activity.type !== 'ip' && !/zruš/i.test(`${activity.title} ${activity.notes ?? ''}`)
}

export function plannedHours(startTime: string | null, endTime: string | null) {
  if (!startTime) return 0
  if (!endTime) return 3
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  return Math.max(0, (minutes(endTime) - minutes(startTime)) / 60)
}
