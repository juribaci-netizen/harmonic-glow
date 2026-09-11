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
function freeWindows(date:string,entries:Entry[]):Interval[] {
  let free:Interval[]=[[IP_START,780],[840,IP_END]]
  for(const [a,b] of blockedTimes(date,entries))free=free.flatMap(([s,e])=>b<=s||a>=e?[[s,e] as Interval]:[...(a>s?[[s,a] as Interval]:[]),...(b<e?[[b,e] as Interval]:[])])
  return free
}
export function freeIpTimes(date:string,entries:Entry[]):Interval[] {
  const blocks=freeWindows(date,entries).flatMap(([start,end])=>{
    const result:Interval[]=[]
    for(let s=start;s<end;s+=210){
      const e=Math.min(end,s+180)
      if(e-s>=60)result.push([s,e])
    }
    return result
  })
  return blocks.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0])||a[0]-b[0]).slice(0,2).sort((a,b)=>a[0]-b[0])
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
  // At most one longer, single-session day per week, and only if shorter
  // sessions could not fill the target. Existing manual long sessions count.
  const hasLongManual=active.some(e=>isIp(e)&&Number(e.hours)>3)
  if(remaining>0&&!hasLongManual){
    const day=days.find(d=>d.free.length===1&&d.minutes<=180&&d.used+240<=480&&freeWindows(d.date,entries).some(([s,e])=>e-s>=240))
    if(day){
      const window=freeWindows(day.date,entries).find(([s,e])=>e-s>=240)!
      const add=Math.min(remaining,240-day.minutes)
      day.minutes+=add;remaining-=add;day.free=[[window[0],window[0]+day.minutes]]
    }
  }
  return days.flatMap(day=>{
    const amounts=day.free.map(()=>0)
    let left=day.minutes
    // Spread time between available blocks instead of filling the first one.
    while(left>0){
      const i=amounts.map((n,i)=>({n,i})).filter(({n,i})=>n<day.free[i][1]-day.free[i][0]).sort((a,b)=>a.n-b.n||a.i-b.i)[0]?.i
      if(i===undefined)break
      const add=Math.min(30,left,day.free[i][1]-day.free[i][0]-amounts[i]);amounts[i]+=add;left-=add
    }
    return day.free.flatMap(([start],i)=>amounts[i]>0?[{date:day.date,startTime:clockTime(start),endTime:clockTime(start+amounts[i]),hours:String(amounts[i]/60)}]:[])
  })
}
