"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { CalendarDays, ChevronRight, Clock3, MapPin, PlaySquare } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({
  name, upcoming, weekActivities
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

  const days = useMemo(()=>{
    const start = new Date(now)
    start.setHours(0,0,0,0)
    return Array.from({length:7},(_,i)=>{
      const d = new Date(start)
      d.setDate(start.getDate()+i)
      return d
    })
  },[])

  const localIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + day
  }
  const todayIso = localIso(now)
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
          {days.map(d=>{
            const iso=localIso(d)
            const active=iso===selectedDate
            const has=weekActivities.some(a=>a.date===iso && a.type!=="off")
            return <button key={iso} onClick={()=>setSelectedDate(iso)} className={"flex flex-col items-center rounded-[14px] py-2.5 "+(active?"bg-black text-white":"")}>
              <span className={"text-[8px] font-bold uppercase "+(active?"text-white/55":"text-black/35")}>{d.toLocaleDateString(locale,{weekday:"short"}).replace(".","")}</span>
              <span className="mt-1 text-[20px] font-bold leading-none">{d.getDate()}</span>
              <span className={"mt-1 h-1.5 w-1.5 rounded-full "+(has?"bg-[#0a84ff]":"bg-black/12")}/>
            </button>
          })}
        </div>

        <div className="mt-3 border-t border-black/[.06] pt-3">
          <p className="px-1 text-[17px] font-bold capitalize tracking-[-.02em]">{selectedLabel}</p>

          {selectedActivities.length===0 ? (
            <div className="mt-2 rounded-[18px] bg-[#f2f2f7] px-4 py-4">
              <p className="text-[14px] font-semibold">Voľno</p>
            </div>
          ) : (
            <div className="mt-2 overflow-hidden rounded-[18px] bg-[#f2f2f7]">
              {selectedActivities.map(a=><div key={a.id} className="flex items-start gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#0a84ff] shadow-sm"><CalendarDays className="h-4 w-4"/></div>
                <div className="min-w-0 flex-1">
                  {a.startTime&&<p className={"flex items-center gap-2 text-[17px] font-extrabold tracking-[-.02em] "+(/konkurz/i.test(a.title)?"text-[#af52de]":"text-black")}><Clock3 className={"h-4 w-4 "+(/konkurz/i.test(a.title)?"text-[#af52de]":"text-[#0a84ff]")}/>{a.startTime}{a.endTime?" – "+a.endTime:""}</p>}
                  <div className="mt-1 flex items-center gap-2">
                    <p className={"text-[13px] font-semibold "+(/konkurz/i.test(a.title)?"text-[#af52de]":"text-black/65")}>{a.type==="off"?"Voľno":a.title}</p>
                    {/konkurz/i.test(a.title)&&<span className="rounded-full bg-[#af52de]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.05em] text-[#af52de]">Konkurz</span>}
                  </div>
                  {a.venue&&<p className="mt-1 flex items-center gap-1.5 text-[10px] text-black/40"><MapPin className="h-3 w-3"/>{a.venue}</p>}
                </div>
              </div>)}
            </div>
          )}

          <Link href="/schedule" className="mt-3 flex items-center justify-between rounded-[18px] bg-black px-4 py-3.5 text-white">
            <span className="text-[13px] font-semibold">Celý plán práce</span>
            <ChevronRight className="h-4 w-4 text-white/55"/>
          </Link>
        </div>
      </div>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Náhľad</h2>
      </div>

      <Link href="/videos" className="apple-card block overflow-hidden rounded-[26px]">
        <div className="relative h-[150px] bg-gradient-to-br from-[#101012] via-[#323238] to-[#8f8f97]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,.22),transparent_35%)]"/>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/55">Koncerty</p>
                <h3 className="mt-1 text-[20px] font-bold tracking-[-.02em]">Archív Slovenskej filharmónie</h3>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg"><PlaySquare className="h-5 w-5"/></span>
            </div>
          </div>
        </div>
      </Link>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Najbližšie</h2>
        <Link href="/schedule" className="text-[12px] font-semibold text-[#0a84ff]">Všetko</Link>
      </div>
      <div className="apple-card overflow-hidden rounded-[24px]">
        {upcoming.length===0 ? <p className="p-6 text-center text-[13px] text-black/40">Žiadne nadchádzajúce aktivity</p> :
          upcoming.slice(0,3).map(a=><Link href="/schedule" key={a.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[14px] bg-[#f2f2f7]">
              <span className="text-[8px] font-bold uppercase text-black/34">{new Date(a.date+"T00:00:00").toLocaleDateString(locale,{month:"short"})}</span>
              <span className="text-[20px] font-extrabold leading-none">{new Date(a.date+"T00:00:00").getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={"truncate text-[13px] font-semibold "+(/konkurz/i.test(a.title)?"text-[#af52de]":"")}>{a.title}</p>
              {a.startTime&&<p className={"mt-1 text-[14px] font-extrabold tracking-[-.01em] "+(/konkurz/i.test(a.title)?"text-[#af52de]":"")}>{a.startTime}{a.endTime?" – "+a.endTime:""}</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-black/18"/>
          </Link>)
        }
      </div>
    </section>
  </div>
}
