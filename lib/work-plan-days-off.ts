import { seasonData } from './season-data-2026-27'
import { canChooseParticipation } from './work-plan'

// Explicit days off in the PDF-derived plan. Missing dates are not days off.
const daysOff=new Set(seasonData.filter(a=>a.type==='off').map(a=>a.date))
for(const activity of seasonData)if(canChooseParticipation(activity))daysOff.delete(activity.date)
export function isWorkPlanDayOff(date:string){return daysOff.has(date)}
