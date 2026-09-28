import { DEFAULT_PREPARATION_PREFERENCES,type PreparationPreferences } from './preparation-preferences'
import { seasonData } from '../season-data-2026-27'
import { WEEKLY_TARGET_MINUTES, isIp, isService, timeMinutes, type Entry } from './model'

export const IP_START = 8 * 60
export const IP_END = 22 * 60
type Interval = [number, number]
export const clockTime = (m:number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`
export function blockedTimes(date:string, entries:Entry[]):Interval[] {
  const declined=new Set(entries.filter(e=>e.status==='removed').map(e=>e.activityId))
  const activities=[...seasonData.flatMap((e,i)=>e.date===date&&!declined.has(i+1)?[e]:[]),...entries.filter(e=>e.date===date&&!isIp(e)&&e.status!=='removed'&&!(e.type==='manual-service'&&e.status==='unconfirmed'))]
  return activities.flatMap(e=>{
    if(e.type==='off'||e.type==='ip'||e.type==='individual')return []
    if(/zruš/i.test(`${e.title} ${e.notes??''}`))return []
    const start=timeMinutes(e.startTime),end=timeMinutes(e.endTime)
    // An item without a known ending cannot safely be followed by automatic IP.
    return start===null ? (e.type==='off'||!e.startTime ? [[IP_START,IP_END] as Interval] : []) : [[start,end??1440] as Interval]
  })
}
export function overlaps(start:number,end:number,blocked:Interval[]) {
  return blocked.some(([a,b])=>start<b&&end>a)
}
function preferredStart(date:string,preferences:PreparationPreferences){
  const day=new Date(date+'T12:00:00').getDay()
  return day===0||day===6?preferences.weekendStart:preferences.weekdayStart
}
function freeWindows(date:string,entries:Entry[],preferences:PreparationPreferences,late=false):Interval[] {
  const start=preferredStart(date,preferences),end=late?preferences.latestEnd:preferences.preferredEnd
  // Morning sessions may run 09–13 or 10–14, followed by a lunch break.
  const lunchStart=Math.max(780,start+240),lunchEnd=lunchStart+60
  let free:Interval[]=[[start,Math.min(lunchStart,end)],[lunchEnd,end]].filter(([a,b])=>b>a) as Interval[]
  for(const [a,b] of blockedTimes(date,entries))free=free.flatMap(([s,e])=>b<=s||a>=e?[[s,e] as Interval]:[...(a>s?[[s,a] as Interval]:[]),...(b<e?[[b,e] as Interval]:[])])
  return free
}
export function countedHours(entries:Entry[]) {
  return entries.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&(isIp(e)||isService(e)))
    .reduce((sum,e)=>sum+(Number.isFinite(Number(e.hours))?Math.max(0,Number(e.hours)):0),0)
}
export function planWeekIp(dates:string[],entries:Entry[],preferences:PreparationPreferences=DEFAULT_PREPARATION_PREFERENCES) {
  const active=entries.filter(e=>dates.includes(e.date)&&!['removed','suggested','unconfirmed'].includes(e.status)&&(isIp(e)||isService(e))&&!(isIp(e)&&e.status==='auto'))
  let remaining=Math.max(0,WEEKLY_TARGET_MINUTES-Math.round(countedHours(active)*60))
  const planned:{date:string;startTime:string;endTime:string;hours:string}[]=[]
  const addBlock=(date:string,topUp=false,allowServiceTopUp=false,budget=Infinity,late=false)=>{
    // A manual preparation entry or explicit removal protects the entire day.
    const manual=entries.filter(e=>e.date===date&&isIp(e)&&!['auto','suggested','unconfirmed'].includes(e.status))
    if(manual.some(e=>e.status==='removed'||!e.startTime||!e.endTime))return
    if(manual.length&&!allowServiceTopUp)return
    const day=active.filter(e=>e.date===date),services=day.filter(isService)
    if(topUp&&services.length&&!allowServiceTopUp)return
    const generated=planned.filter(e=>e.date===date)
    const existing=[...generated,...manual.map(e=>({startTime:e.startTime!,endTime:e.endTime!}))]
    const used=Math.round((countedHours(day)+generated.reduce((sum,e)=>sum+Number(e.hours),0))*60)
    if(late){
      for(const block of generated){
        const end=timeMinutes(block.endTime)!,start=timeMinutes(block.startTime)!
        const extra=Math.min(remaining,preferences.latestEnd-end,480-used,240-(end-start))
        if(end===preferences.preferredEnd&&extra>=30&&!overlaps(end,end+extra,[...blockedTimes(date,entries),...existing.filter(ip=>ip!==block).map(ip=>[timeMinutes(ip.startTime)!,timeMinutes(ip.endTime)!] as Interval)])){
          block.endTime=clockTime(end+extra);block.hours=String((end+extra-start)/60);remaining-=extra
          return
        }
      }
    }
    if(existing.length>=2)return
    // When the last fraction would create an awkward short block, permit
    // a natural whole/two-hour ending within one hour above the weekly target.
    const rounded=preferences.roundBlocks&&budget===Infinity&&remaining>0
      ? (Math.ceil(remaining/120)*120<=remaining+60?Math.ceil(remaining/120)*120:Math.ceil(remaining/60)*60)
      : remaining
    const maximum=Math.min(topUp?240:services.length>=2?120:240,budget,rounded,Math.max(0,480-used))
    if(maximum<30)return
    let windows=freeWindows(date,entries,preferences,late)
    for(const ip of existing){
      const start=timeMinutes(ip.startTime)!,end=timeMinutes(ip.endTime)!
      windows=windows.flatMap(([a,b])=>end<=a||start>=b?[[a,b] as Interval]:[...(start>a?[[a,start] as Interval]:[]),...(end<b?[[end,b] as Interval]:[])])
    }
    const firstStart=Math.min(...services.map(e=>timeMinutes(e.startTime)??1440))
    const hasEvening=services.some(e=>(timeMinutes(e.startTime)??0)>=1020)
    const morning=preferredStart(date,preferences)
    const afternoon=Math.max(840,morning+300)
    const preferred=services.length>=2?(hasEvening?[afternoon,morning,1020]:[1020,afternoon,morning]):services.length&&firstStart<780?[840,480,1020]:[morning,afternoon,1020]
    // Keep full 08–12 / 14–18 blocks where possible; double-service days
    // start with 14–16 or 17–19. Only the remaining weekly deficit shortens a block.
    const starts=[...new Set([...preferred,...windows.map(([a])=>Math.ceil(a/30)*30),...existing.map(ip=>timeMinutes(ip.endTime)!+30)])]
    const candidates=starts.flatMap(start=>{
      const window=windows.find(([a,b])=>start>=a&&start<b)
      if(!window)return []
      // Keep separately entered blocks separated by a break.
      if(existing.some(ip=>start===timeMinutes(ip.endTime)))return []
      const endLimit=Math.min(window[1],...existing.filter(ip=>timeMinutes(ip.startTime)!>start).map(ip=>timeMinutes(ip.startTime)!-30))
      const duration=Math.min(maximum,Math.floor((endLimit-start)/30)*30)
      return duration>=30?[{start,duration}]:[]
    })
    const choice=candidates.find(c=>c.duration===maximum)??candidates.sort((a,b)=>b.duration-a.duration)[0]
    if(!choice)return
    planned.push({date,startTime:clockTime(choice.start),endTime:clockTime(choice.start+choice.duration),hours:String(choice.duration/60)})
    remaining-=choice.duration
  }
  // Spread the initial weekly budget across every available day, including
  // free days before a busy program. Do not reserve the entire fund for services.
  const allocations=dates.filter(date=>!entries.some(e=>e.date===date&&isIp(e)&&!['auto','suggested','unconfirmed'].includes(e.status))&&freeWindows(date,entries,preferences).some(([a,b])=>b-a>=30))
    .map(date=>({date,minutes:active.filter(e=>e.date===date&&isService(e)).length>=2?120:240}))
  const desired=allocations.reduce((sum,e)=>sum+e.minutes,0)
  const ratio=desired?Math.min(1,remaining/desired):0
  for(const {date,minutes} of allocations)addBlock(date,false,false,Math.floor(minutes*ratio/30)*30)
  const byDailyLoad=()=>[...dates].sort((a,b)=>{
    const load=(date:string)=>countedHours(active.filter(e=>e.date===date))+planned.filter(e=>e.date===date).reduce((sum,e)=>sum+Number(e.hours),0)
    return load(a)-load(b)||a.localeCompare(b)
  })
  for(const date of byDailyLoad())addBlock(date,true)
  // Add only into an unused free slot; keep each manual range and cleared
  // day intact. This also allows small residual deficits on service days.
  for(const date of byDailyLoad())addBlock(date,true,true)
  // Use the optional later limit only after all normal-time slots were tried.
  if(remaining>=30&&preferences.latestEnd>preferences.preferredEnd)
    for(const date of byDailyLoad())addBlock(date,true,true,Infinity,true)
  return planned.sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime))
}
