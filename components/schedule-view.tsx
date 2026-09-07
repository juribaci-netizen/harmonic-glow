"use client"

import { useMemo, useState, useTransition } from "react"
import { useI18n } from "@/components/language-provider"
import { activityTypeKey, typeStyles } from "@/lib/activity-format"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react"

type Activity={id:number;date:string;type:string;startTime:string|null;endTime:string|null;title:string;conductor:string|null;venue:string|null;program:string|null;notes:string|null}

const filters = ["all","rehearsal","concert","recording","dress","ip","other"] as const

export function ScheduleView({activities,seedSeason}:{activities:Activity[];seedSeason:()=>Promise<{seeded:boolean;count?:number}>}){
 const {t,lang}=useI18n(); const [cursor,setCursor]=useState(()=>new Date()); const [filter,setFilter]=useState("all"); const [pending,startTransition]=useTransition(); const locale=lang==="sk"?"sk-SK":"en-GB"; const year=cursor.getFullYear(); const month=cursor.getMonth()
 const monthName=cursor.toLocaleDateString(locale,{month:"long",year:"numeric"}); const first=new Date(year,month,1).getDay(); const days=useMemo(()=>Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>i+1),[year,month])
 const visible=activities.filter(a=>{const d=new Date(a.date+"T00:00:00");return d.getFullYear()===year&&d.getMonth()===month&&(filter==="all"||a.type===filter)})
 const byDay=new Map<number,Activity[]>(); visible.forEach(a=>{const day=Number(a.date.slice(-2));byDay.set(day,[...(byDay.get(day)||[]),a])})
 const seed=()=>startTransition(async()=>{await seedSeason();window.location.reload()})
 const fmt=(a:Activity)=>a.startTime?`${a.startTime}${a.endTime?` – ${a.endTime}`:""}`:""
 const label=(key:string)=>{const map:Record<string,string>={recording:"Nahrávanie",dress:"Generálka",ip:"IP",other:"Iné"};return map[key]??(t[activityTypeKey[key]??"type_other"]||key)}
 return <div className="flex flex-col gap-5 pb-3"><header><h1 className="font-serif text-[28px] font-semibold">{t.seasonSchedule}</h1><p className="mt-1 text-xs text-muted-foreground">24. 8. 2026 – 3. 1. 2027 · Slovenská filharmónia</p></header>
  {activities.length===0&&<Button className="w-full rounded-xl" onClick={seed} disabled={pending}>{pending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t.seedSeason}</Button>}
  <div className="flex items-center justify-between"><Button variant="outline" size="icon" className="rounded-xl" onClick={()=>setCursor(new Date(year,month-1,1))}><ChevronLeft/></Button><p className="font-semibold capitalize">{monthName}</p><Button variant="outline" size="icon" className="rounded-xl" onClick={()=>setCursor(new Date(year,month+1,1))}><ChevronRight/></Button></div>
  <Card className="rounded-2xl p-3 shadow-none"><div className="mb-2 grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">{t.weekdays.map(d=><div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 gap-y-1 text-center">{Array.from({length:first}).map((_,i)=><div key={`x${i}`}/>) }{days.map(day=>{const items=byDay.get(day)||[];const isToday=new Date().getDate()===day&&new Date().getMonth()===month&&new Date().getFullYear()===year;return <button key={day} className={`relative flex h-8 items-center justify-center text-xs ${isToday?"font-bold text-white":"text-foreground"}`}><span className={isToday?"flex h-7 w-7 items-center justify-center rounded-full bg-[#17233d]":""}>{day}</span>{items.length>0&&<span className="absolute bottom-0 flex gap-0.5">{items.slice(0,3).map(a=><i key={a.id} className={`h-1 w-1 rounded-full ${(typeStyles[a.type]??typeStyles.other).dot}`}/>)}</span>}</button>})}</div></Card>
  <div className="flex gap-2 overflow-x-auto pb-1">{filters.map(f=><button key={f} onClick={()=>setFilter(f)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium ${filter===f?(f==="concert"?"bg-[#fff0f2] text-rose-700":f==="recording"?"bg-[#edf8f2] text-emerald-700":f==="dress"?"bg-[#fff7e8] text-amber-700":"bg-[#17233d] text-white"):"bg-[#f0f4fa] text-foreground"}`}>{f==="all"?t.allTypes:label(f)}</button>)}</div>
  <section className="space-y-3">{visible.length===0?<Card className="p-8 text-center text-sm text-muted-foreground">{t.noUpcoming}</Card>:visible.map(a=>{const s=typeStyles[a.type]??typeStyles.other;return <Card key={a.id} className="rounded-xl p-4 shadow-none"><div className="flex gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{fmt(a)||a.title}</p><p className="mt-0.5 text-xs text-foreground">{a.title}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] ${s.badge}`}>{label(a.type)}</span></div>{a.conductor&&<p className="mt-2 text-[11px] font-medium">Diriguje: {a.conductor}</p>}{a.venue&&<p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3"/>{a.venue}</p>}{a.program&&<p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.program}</p>}{a.notes&&<p className="mt-2 rounded-lg bg-[#f7f9fc] p-2 text-[11px] leading-relaxed text-muted-foreground">{a.notes}</p>}</div></div></Card>})}</section>
 </div>
}
