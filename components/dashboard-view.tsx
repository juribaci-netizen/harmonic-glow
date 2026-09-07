"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { CalendarDays, ClipboardCheck, PlaySquare, ChevronRight, Clock3, MapPin } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({
  name, today, upcoming, weekActivities, monthHours
}:{
  name:string
  today:Activity[]
  upcoming:Activity[]
  weekActivities:Activity[]
  recentEntries:Entry[]
  monthHours:number
  monthActivityCount:number
  monthConcertCount:number
  todayHours:number
}) {
  const { lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const firstName = name.split(" ")[0]
  const now = new Date()
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})

  const weekDays = useMemo(()=>{
    const start = new Date(now)
    start.setHours(0,0,0,0)

    return Array.from({length:7},(_,i)=>{
      const d = new Date(start)
      d.setDate(start.getDate()+i)
      return d
    })
  },[])

  const todayIso = now.toISOString().slice(0,10)
  const [selectedDate,setSelectedDate] = useState(todayIso)

  const selectedActivities = weekActivities.filter(a=>a.date===selectedDate)
  const selectedDay = new Date(selectedDate+"T00:00:00")
  const selectedLabel = selectedDay.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})

  return <div className="space-y-5">
    <header className="pt-2">
      <p className="text-[11px] font-semibold capitalize text-black/38">{todayLabel}</p>
      <h1 className="ios-title mt-1">Ahoj, {firstName}</h1>
    </header>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Plán práce</h2>
        <span className="text-[11px] font-medium text-black/35">od dneška</span>
      </div>

      <div className="apple-card rounded-[26px] p-3">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(d=>{
            const iso=d.toISOString().slice(0,10)
            const active=iso===selectedDate
            const has=weekActivities.some(a=>a.date===iso && a.type!=="off")
            const off=weekActivities.some(a=>a.date===iso && a.type==="off")
            return <button key={iso} onClick={()=>setSelectedDate(iso)} className={"flex flex-col items-center rounded-[14px] py-2.5 "+(active?"bg-black text-white":"")}>
              <span className={"text-[8px] font-bold uppercase "+(active?"text-white/55":"text-black/35")}>{d.toLocaleDateString(locale,{weekday:"short"}).replace(".","")}</span>
              <span className="mt-1 text-[16px] font-bold">{d.getDate()}</span>
              <span className={"mt-1 h-1.5 w-1.5 rounded-full "+(has?(active?"bg-[#0a84ff]":"bg-[#0a84ff]"):off?(active?"bg-white/35":"bg-black/18"):"bg-transparent")}/>
            </button>
          })}
        </div>

        <div className="mt-3 border-t border-black/[.06] pt-3">
          <p className="px-1 text-[10px] font-semibold capitalize text-black/38">{selectedLabel}</p>
          {selectedActivities.length===0 ? (
            <div className="mt-2 rounded-[18px] bg-[#f2f2f7] px-4 py-4">
              <p className="text-[14px] font-semibold">Voľno</p>
              <p className="mt-1 text-[11px] text-black/38">Žiadna naplánovaná aktivita.</p>
            </div>
          ) : (
            <div className="mt-2 overflow-hidden rounded-[18px] bg-[#f2f2f7]">
              {selectedActivities.map(a=><div key={a.id} className="flex items-start gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#0a84ff] shadow-sm"><CalendarDays className="h-4 w-4"/></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{a.type==="off"?"Voľno":a.title}</p>
                  {a.startTime&&<p className="mt-1 flex items-center gap-1.5 text-[10px] text-black/40"><Clock3 className="h-3 w-3"/>{a.startTime}{a.endTime?" – "+a.endTime:""}</p>}
                  {a.venue&&<p className="mt-1 flex items-center gap-1.5 text-[10px] text-black/40"><MapPin className="h-3 w-3"/>{a.venue}</p>}
                </div>
              </div>)}
            </div>
          )}
        </div>

        <Link href="/schedule" className="mt-3 flex items-center justify-between rounded-[18px] bg-black px-4 py-3.5 text-white">
          <span className="text-[13px] font-semibold">Otvoriť celý plán práce</span>
          <ChevronRight className="h-4 w-4 text-white/55"/>
        </Link>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3">
      <Link href="/timesheet" className="rounded-[24px] bg-[#0a84ff] p-4 text-white shadow-[0_10px_24px_rgba(10,132,255,.22)]">
        <ClipboardCheck className="h-5 w-5"/>
        <p className="mt-7 text-[11px] font-semibold text-white/70">EPČ</p>
        <p className="mt-1 text-[26px] font-bold tracking-[-.035em]">{monthHours.toFixed(0)} h</p>
      </Link>

      <Link href="/videos" className="apple-card rounded-[24px] p-4">
        <PlaySquare className="h-5 w-5 text-[#0a84ff]"/>
        <p className="mt-7 text-[11px] font-semibold text-black/40">Koncerty</p>
        <p className="mt-1 text-[17px] font-bold">Archív</p>
      </Link>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1"><h2 className="ios-section-title">Najbližšie</h2><Link href="/schedule" className="text-[12px] font-semibold text-[#0a84ff]">Všetko</Link></div>
      <div className="apple-card overflow-hidden rounded-[24px]">
        {upcoming.length===0 ? <p className="p-6 text-center text-[13px] text-black/40">Žiadne nadchádzajúce aktivity</p> :
          upcoming.slice(0,3).map(a=><Link href="/schedule" key={a.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[12px] bg-[#f2f2f7]">
              <span className="text-[8px] font-bold uppercase text-black/34">{new Date(a.date+"T00:00:00").toLocaleDateString(locale,{month:"short"})}</span>
              <span className="text-[17px] font-bold leading-none">{new Date(a.date+"T00:00:00").getDate()}</span>
            </div>
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{a.title}</p><p className="mt-0.5 truncate text-[10px] text-black/38">{a.startTime || ""}</p></div>
            <ChevronRight className="h-4 w-4 text-black/18"/>
          </Link>)
        }
      </div>
    </section>
  </div>
}
