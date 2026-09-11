import geometry from './geometry.json'

export { geometry }
export const MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December']
export type Slot = 1 | 2
export type Ensemble = 'orchester' | 'zbor' | 'sko'
export type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string; notes:string|null; startTime?:string|null; endTime?:string|null }
export const isIp = (entry:Entry) => entry.type === 'individual' || entry.type === 'ip'
export const isService = (entry:Entry) => !isIp(entry) && entry.type !== 'off'
export function validateMonth(year:number, month:number) {
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isInteger(month) || month < 0 || month > 11) throw new Error('Neplatný mesiac.')
}
export function validateDate(date:string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date+'T12:00:00Z').toISOString().slice(0,10) !== date) throw new Error('Neplatný dátum.')
}
export function timeMinutes(time:string|null|undefined) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null
  const [h,m]=time.split(':').map(Number)
  return h >= 0 && h <= 24 && m >= 0 && m < 60 && (h < 24 || m === 0) ? h*60+m : null
}
export function parseRange(value:string):[string|null,string|null]|null {
  if (!value.trim()) return [null,null]
  const match=value.trim().match(/^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const start=match[1].padStart(2,'0')+':'+match[2], end=match[3].padStart(2,'0')+':'+match[4]
  const s=timeMinutes(start), e=timeMinutes(end)
  return s!==null && e!==null && e>s ? [start,end] : null
}
export function bratislavaNow(now=new Date()) {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]))
  return {date:`${p.year}-${p.month}-${p.day}`,minutes:Number(p.hour)*60+Number(p.minute)}
}
export function visible(entry:Entry|undefined, now=bratislavaNow()) {
  if (!entry || entry.status==='removed' || entry.status==='suggested') return false
  if (entry.status==='manual' || entry.type==='manual-service') return true
  if (entry.date!==now.date) return entry.date<now.date
  const end=timeMinutes(entry.endTime) ?? (isService(entry) && timeMinutes(entry.startTime)!==null ? timeMinutes(entry.startTime)!+180 : null)
  // Automatic preparation without a time is only completed after the day ends.
  return end!==null && end<=now.minutes
}
export function slotNote(notes:string|null, kind:'service'|'ip', slot:Slot) {
  return (notes??'').replace(/\[epc-slot:(service|ip):[12]\]/g,'').trim()+` [epc-slot:${kind}:${slot}]`
}
export function assignedSlots(entries:Entry[], kind:'service'|'ip'):[Entry|undefined,Entry|undefined] {
  const result:[Entry|undefined,Entry|undefined]=[undefined,undefined]
  const rows=entries.filter(e=>e.status!=='suggested' && (kind==='ip'?isIp(e):isService(e)))
    .sort((a,b)=>String(a.startTime??'').localeCompare(String(b.startTime??'')) || a.id-b.id)
  const legacy:Entry[]=[]
  for (const e of rows) {
    const marker=e.notes?.match(new RegExp(`\\[epc-slot:${kind}:([12])\\]`))
    const oldManual=kind==='service'?e.title.match(/Manuálne pridaná ([12])\./):null
    const slot=marker?.[1]??oldManual?.[1]
    if (slot) result[Number(slot)-1]=e
    else legacy.push(e)
  }
  for (const e of legacy) {
    // The original morning/afternoon fields determine a lone legacy timed IP's column.
    let index=kind==='ip' && (timeMinutes(e.startTime)??(e.status==='auto'?timeMinutes(automaticRange(e,entries).split('-')[0]):0)??0)>=720 && !result[1] ? 1 : result.findIndex(x=>!x)
    if(index>=0 && index<2) result[index]=e
  }
  return result
}
function automaticRange(entry:Entry, dayEntries:Entry[]) {
  const duration=Math.round(Number(entry.hours)*60)
  if(!duration || duration<0)return ''
  const work=dayEntries.filter(e=>isService(e)&&e.status!=='removed'&&e.status!=='suggested')
  const starts=work.map(e=>timeMinutes(e.startTime)).filter((x):x is number=>x!==null)
  const ends=work.map(e=>timeMinutes(e.endTime)).filter((x):x is number=>x!==null)
  let start=600
  if(starts.length&&Math.min(...starts)>=840) start=Math.max(480,Math.min(...starts)-duration-60)
  else if(ends.length) start=Math.max(840,Math.max(...ends)+60)
  if(start+duration>1320) start=Math.max(480,1320-duration)
  const hh=(m:number)=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')
  return start+duration<=1440?`${hh(start)}-${hh(start+duration)}`:''
}
export function dayValues(entries:Entry[], date:string, now=bratislavaNow()) {
  const rows=entries.filter(e=>e.date===date)
  const services=assignedSlots(rows,'service')
  const ips=assignedSlots(rows,'ip')
  const ranges=ips.map(e=>!visible(e,now)?'':e?.startTime&&e.endTime?`${e.startTime}-${e.endTime}`:e?automaticRange(e,rows):'')
  // An auto-generated IP without explicit times belongs in the field matching its start.
  if(ips[0]?.status==='auto' && !ips[0].startTime && ranges[0] && !ips[1] && Number(ranges[0].slice(0,2))>=12) {
    ranges[1]=ranges[0];ranges[0]=''
  }
  return {services:services.map(e=>visible(e,now)) as [boolean,boolean], ranges:ranges as [string,string]}
}
export function fieldRect(name:string) {
  const r=(geometry.fields as Record<string,number[]>)[name]
  if(!r)throw new Error('Unknown EPC field '+name)
  return {x:r[0],y:r[1],width:r[2]-r[0],height:r[3]-r[1],top:geometry.height-r[3]}
}
