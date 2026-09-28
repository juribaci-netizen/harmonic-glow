import { assignedSlots, isIp, timeMinutes, WEEKLY_TARGET_MINUTES, type Entry, type Slot } from './model'
import { blockedTimes, clockTime, countedHours, overlaps } from './ip-planning'
import type { PreparationPreferences } from './preparation-preferences'

export type PreparationRepair={date:string;slot:Slot;startTime:string;endTime:string;hours:number;weekStart:string;missingHours:number;replacesCleared:boolean}
export function preparationRepairs(entries:Entry[],year:number,month:number,preferences:PreparationPreferences):PreparationRepair[]{
  const first=new Date(Date.UTC(year,month,1)),last=new Date(Date.UTC(year,month+1,0))
  first.setUTCDate(first.getUTCDate()-(first.getUTCDay()+6)%7)
  const suggestions:PreparationRepair[]=[]
  for(let monday=new Date(first);monday<=last;monday.setUTCDate(monday.getUTCDate()+7)){
    const dates=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10)})
    const week=entries.filter(e=>dates.includes(e.date)),missing=WEEKLY_TARGET_MINUTES-Math.round(countedHours(week)*60)
    if(missing<30)continue
    const candidates:PreparationRepair[]=[]
    for(const date of dates){
      const rows=week.filter(e=>e.date===date),ips=assignedSlots(rows,'ip')
      const slot=ips.findIndex(e=>!e||e.status==='removed')
      if(slot<0)continue
      const active=rows.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&isIp(e))
      if(active.some(e=>timeMinutes(e.startTime)===null||timeMinutes(e.endTime)===null))continue
      const blocked=[...blockedTimes(date,rows),...active.map(e=>[timeMinutes(e.startTime)!,timeMinutes(e.endTime)!] as [number,number])]
      const day=new Date(date+'T12:00:00Z').getUTCDay(),start=day===0||day===6?preferences.weekendStart:preferences.weekdayStart
      const lunch=Math.max(780,start+240)
      blocked.push([lunch,lunch+60])
      const capacity=Math.min(missing,240,480-Math.round(countedHours(rows)*60))
      if(capacity<30)continue
      for(let from=Math.ceil(start/30)*30;from<preferences.preferredEnd;from+=30){
        let duration=Math.floor(capacity/30)*30
        while(duration>=30&&(from+duration>preferences.preferredEnd||overlaps(from,from+duration,blocked)))duration-=30
        if(duration<30)continue
        candidates.push({date,slot:(slot+1) as Slot,startTime:clockTime(from),endTime:clockTime(from+duration),hours:duration/60,weekStart:dates[0],missingHours:missing/60,replacesCleared:ips[slot]?.status==='removed'})
        break
      }
    }
    // Offer one concrete block per week, then recompute after each confirmation.
    candidates.sort((a,b)=>b.hours-a.hours||countedHours(week.filter(e=>e.date===a.date))-countedHours(week.filter(e=>e.date===b.date))||a.date.localeCompare(b.date))
    if(candidates[0])suggestions.push(candidates[0])
  }
  return suggestions
}
