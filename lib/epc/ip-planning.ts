import { seasonData } from '../season-data-2026-27'
import { isIp, timeMinutes, type Entry } from './model'

export const IP_START = 9 * 60
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
export function freeIpTimes(date:string,entries:Entry[]):Interval[] {
  let free:Interval[]=[[IP_START,780],[840,IP_END]]
  for(const [a,b] of blockedTimes(date,entries))free=free.flatMap(([s,e])=>b<=s||a>=e?[[s,e] as Interval]:[...(a>s?[[s,a] as Interval]:[]),...(b<e?[[b,e] as Interval]:[])])
  // The form has two IP fields; choose the two largest available blocks.
  return free.map(([s,e]):Interval=>[s,Math.min(e,s+240)]).filter(([s,e])=>e-s>=30).sort((a,b)=>(b[1]-b[0])-(a[1]-a[0])||a[0]-b[0]).slice(0,2).sort((a,b)=>a[0]-b[0])
}
export function planWeekIp(dates:string[],entries:Entry[]) {
  const active=entries.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&!(isIp(e)&&e.status==='auto'))
  let remaining=Math.max(0,2400-active.reduce((n,e)=>n+Math.round(Number(e.hours)*60),0))
  const days=dates.slice(0,5).map(date=>{
    const manual=entries.some(e=>e.date===date&&isIp(e)&&e.status!=='auto'&&e.status!=='suggested')
    const used=active.filter(e=>e.date===date).reduce((n,e)=>n+Math.round(Number(e.hours)*60),0)
    const free=manual?[]:freeIpTimes(date,entries)
    return {date,used,free,minutes:0,capacity:Math.min(Math.max(0,480-used),free.reduce((n,[s,e])=>n+e-s,0))}
  })
  while(remaining>0){
    const day=days.filter(d=>d.minutes<d.capacity).sort((a,b)=>(a.used+a.minutes)-(b.used+b.minutes)||a.date.localeCompare(b.date))[0]
    if(!day)break
    const add=Math.min(30,remaining,day.capacity-day.minutes)
    day.minutes+=add;remaining-=add
  }
  return days.flatMap(day=>{
    let left=day.minutes
    return day.free.flatMap(([start,end])=>{
      const minutes=Math.min(left,end-start);left-=minutes
      return minutes>0?[{date:day.date,startTime:clockTime(start),endTime:clockTime(start+minutes),hours:String(minutes/60)}]:[]
    })
  })
}
