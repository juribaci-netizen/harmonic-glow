import { seasonData } from '../season-data-2026-27'
import { WEEKLY_TARGET_MINUTES, isIp, isService, timeMinutes, type Entry } from './model'

export const IP_START = 8 * 60
export const IP_END = 21 * 60
type Interval = [number, number]
export const clockTime = (m:number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`
export function blockedTimes(date:string, entries:Entry[]):Interval[] {
  const declined=new Set(entries.filter(e=>e.status==='removed').map(e=>e.activityId))
  const activities=[...seasonData.flatMap((e,i)=>e.date===date&&!declined.has(i+1)?[e]:[]),...entries.filter(e=>e.date===date&&!isIp(e)&&e.status!=='removed')]
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
function freeWindows(date:string,entries:Entry[]):Interval[] {
  let free:Interval[]=[[IP_START,780],[840,IP_END]]
  for(const [a,b] of blockedTimes(date,entries))free=free.flatMap(([s,e])=>b<=s||a>=e?[[s,e] as Interval]:[...(a>s?[[s,a] as Interval]:[]),...(b<e?[[b,e] as Interval]:[])])
  return free
}
export function countedHours(entries:Entry[]) {
  return entries.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&(isIp(e)||isService(e)))
    .reduce((sum,e)=>sum+(Number.isFinite(Number(e.hours))?Math.max(0,Number(e.hours)):0),0)
}
export function planWeekIp(dates:string[],entries:Entry[]) {
  const active=entries.filter(e=>dates.includes(e.date)&&!['removed','suggested','unconfirmed'].includes(e.status)&&(isIp(e)||isService(e))&&!(isIp(e)&&e.status==='auto'))
  let remaining=Math.max(0,WEEKLY_TARGET_MINUTES-Math.round(countedHours(active)*60))
  const planned:{date:string;startTime:string;endTime:string;hours:string}[]=[]
  const addBlock=(date:string,topUp=false)=>{
    // A manual preparation entry or explicit removal protects the entire day.
    if(entries.some(e=>e.date===date&&isIp(e)&&e.status!=='auto'&&e.status!=='suggested'))return
    const day=active.filter(e=>e.date===date),services=day.filter(isService)
    if(topUp&&services.length)return
    const existing=planned.filter(e=>e.date===date)
    if(existing.length>=2)return
    const used=Math.round((countedHours(day)+existing.reduce((sum,e)=>sum+Number(e.hours),0))*60)
    const maximum=Math.min(topUp?240:services.length>=2?120:240,remaining,Math.max(0,480-used))
    if(maximum<30)return
    let windows=freeWindows(date,entries)
    for(const ip of existing){
      const start=timeMinutes(ip.startTime)!,end=timeMinutes(ip.endTime)!
      windows=windows.flatMap(([a,b])=>end<=a||start>=b?[[a,b] as Interval]:[...(start>a?[[a,start] as Interval]:[]),...(end<b?[[end,b] as Interval]:[])])
    }
    const firstStart=Math.min(...services.map(e=>timeMinutes(e.startTime)??1440))
    const hasEvening=services.some(e=>(timeMinutes(e.startTime)??0)>=1020)
    const preferred=services.length>=2?(hasEvening?[840,480,1020]:[1020,840,480]):services.length&&firstStart<780?[840,480,1020]:[480,840,1020]
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
  const weekdays=dates.slice(0,5),weekend=dates.slice(5,7)
  // Apply the reference pattern first, then allow a second block (up to
  // eight total work hours/day). Weekend preparation fills remaining gaps.
  for(const date of weekdays)addBlock(date)
  for(const date of weekdays)addBlock(date,true)
  for(const date of weekend)addBlock(date)
  for(const date of weekend)addBlock(date,true)
  return planned.sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime))
}
