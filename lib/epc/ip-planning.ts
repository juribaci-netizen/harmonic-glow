import { seasonData } from '../season-data-2026-27'
import { isIp, isService, timeMinutes, type Entry } from './model'

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
export function planWeekIp(dates:string[],entries:Entry[]) {
  const active=entries.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&!(isIp(e)&&e.status==='auto'))
  let remaining=Math.max(0,2400-active.reduce((n,e)=>n+Math.round(Number(e.hours)*60),0))
  const planned:{date:string;startTime:string;endTime:string;hours:string}[]=[]
  for(const date of dates.slice(0,5)){
    // Service days follow the June form. Days without a played service may
    // split the same preparation duration into two shorter blocks. Manual corrections,
    // including an explicitly cleared day, always take priority.
    if(entries.some(e=>e.date===date&&isIp(e)&&e.status!=='auto'&&e.status!=='suggested'))continue
    const day=active.filter(e=>e.date===date),services=day.filter(isService)
    const used=day.reduce((n,e)=>n+Math.round(Number(e.hours)*60),0)
    const duration=Math.min(services.length>=2?120:240,remaining,Math.max(0,480-used))
    if(duration<30)continue
    const firstStart=Math.min(...services.map(e=>timeMinutes(e.startTime)??1440))
    // Reference slots: 08–12, 14–18, 17–19 or 14–16. Select a free
    // reference slot first; actual service times determine which can be used.
    const hasEvening=services.some(e=>(timeMinutes(e.startTime)??0)>=1020)
    const preferred=services.length>=2?(hasEvening?[840,480,1020]:[1020,840,480]):services.length&&firstStart<780?[840,480,1020]:[480,840,1020]
    const windows=freeWindows(date,entries)
    if(services.length===0&&duration>=120){
      const blockMinutes=Math.min(120,Math.floor(duration/60)*30)
      const choices=[480,840,1020,...windows.map(([a])=>Math.ceil(a/30)*30)]
      const first=choices.find(start=>windows.some(([a,b])=>start>=a&&start+blockMinutes<=b))
      const second=first===undefined?undefined:choices.find(start=>(start>=first+blockMinutes+30||start+duration-blockMinutes+30<=first)&&windows.some(([a,b])=>start>=a&&start+duration-blockMinutes<=b))
      if(first!==undefined&&second!==undefined){
        for(const [start,minutes] of [[first,blockMinutes],[second,duration-blockMinutes]].sort((a,b)=>a[0]-b[0]))
          planned.push({date,startTime:clockTime(start),endTime:clockTime(start+minutes),hours:String(minutes/60)})
        remaining-=duration
        continue
      }
    }
    const fits=(start:number)=>windows.some(([a,b])=>start>=a&&start+duration<=b)
    let start=preferred.find(fits)
    if(start===undefined){
      // If a service uses a reference slot, choose a whole/half-hour start
      // in a genuinely free window instead of overlapping it.
      start=windows.map(([a,b])=>({start:Math.ceil(a/30)*30,end:b})).filter(w=>w.start+duration<=w.end).map(w=>w.start)[0]
    }
    if(start===undefined)continue
    planned.push({date,startTime:clockTime(start),endTime:clockTime(start+duration),hours:String(duration/60)})
    remaining-=duration
  }
  return planned
}
