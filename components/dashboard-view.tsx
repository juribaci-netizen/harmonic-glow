"use client"

import Link from "next/link"
import { useI18n } from "@/components/language-provider"
import { CalendarDays, Clock3, ChevronRight, MapPin, Sparkles } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({ name, today, upcoming, recentEntries, monthHours, monthActivityCount, monthConcertCount, todayHours }: { name:string; today:Activity[]; upcoming:Activity[]; recentEntries:Entry[]; monthHours:number; monthActivityCount:number; monthConcertCount:number; todayHours:number }) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const firstName = name.split(" ")[0]
  const now = new Date()
  const next = today[0] ?? upcoming[0]
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})
  const monthLabel = now.toLocaleDateString(locale,{month:"long",year:"numeric"})
  const fmtDate=(d:string)=>new Date(d+"T00:00:00").toLocaleDateString(locale,{day:"numeric",month:"short"})

  return <div className="space-y-5">
    <header className="pt-1">
      <p className="text-[11px] font-semibold capitalize text-black/42">{todayLabel}</p>
      <h1 className="ios-title mt-1">Ahoj, {firstName}</h1>
    </header>

    <section className="overflow-hidden rounded-[28px] bg-black p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,.18)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/45">Dnes</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"><CalendarDays className="h-4 w-4"/></span>
      </div>
      <h2 className="mt-5 text-[25px] font-bold leading-[1.04] tracking-[-.03em]">{next?.title ?? t.noUpcoming}</h2>
      {next && <div className="mt-5 space-y-2 text-[12px] text-white/64">
        <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5"/>{next.startTime ? next.startTime + (next.endTime ? " – " + next.endTime : "") : fmtDate(next.date)}</p>
        {next.venue && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/>{next.venue}</p>}
      </div>}
      <Link href="/schedule" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-bold text-black">Plán práce<ChevronRight className="h-3.5 w-3.5"/></Link>
    </section>

    <section className="grid grid-cols-2 gap-3">
      <div className="apple-card rounded-[24px] p-4">
        <p className="text-[10px] font-semibold text-black/42">{t.todayWorked}</p>
        <p className="mt-2 text-[30px] font-bold tracking-[-.04em]">{todayHours.toFixed(1)} h</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[.08]"><div className="h-full rounded-full bg-[#0a84ff]" style={{width:String(Math.min(100,(todayHours/8)*100))+"%"}}/></div>
        <p className="mt-2 text-[10px] text-black/38">z 8,0 h</p>
      </div>
      <Link href="/timesheet" className="rounded-[24px] bg-[#0a84ff] p-4 text-white shadow-[0_12px_28px_rgba(10,132,255,.25)]">
        <div className="flex h-full flex-col justify-between">
          <Sparkles className="h-5 w-5"/>
          <div><p className="text-[10px] font-semibold text-white/70">EPČ</p><p className="mt-1 text-[30px] font-bold tracking-[-.04em]">{monthHours.toFixed(0)} h</p></div>
        </div>
      </Link>
    </section>

    <section>
      <div className="mb-3 flex items-end justify-between">
        <div><h2 className="ios-section-title">Tento mesiac</h2><p className="mt-1 text-[11px] capitalize text-black/40">{monthLabel}</p></div>
      </div>
      <div className="apple-card grid grid-cols-3 overflow-hidden rounded-[24px]">
        <Metric value={monthHours.toFixed(0)} label="hodín"/>
        <Metric value={String(monthActivityCount)} label="skúšok"/>
        <Metric value={String(monthConcertCount)} label="koncertov"/>
      </div>
    </section>

    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="ios-section-title">Najbližšie</h2><Link href="/schedule" className="text-[12px] font-semibold text-[#0a84ff]">Zobraziť</Link></div>
      <div className="apple-card overflow-hidden rounded-[24px]">
        {upcoming.length===0 ? <p className="p-6 text-center text-sm text-black/40">{t.noUpcoming}</p> :
          upcoming.slice(0,4).map(a=><Link href="/schedule" key={a.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[14px] bg-[#f2f2f7]">
              <span className="text-[9px] font-bold uppercase text-black/35">{new Date(a.date+"T00:00:00").toLocaleDateString(locale,{month:"short"})}</span>
              <span className="text-[18px] font-bold leading-none">{new Date(a.date+"T00:00:00").getDate()}</span>
            </div>
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{a.title}</p><p className="mt-0.5 truncate text-[10px] text-black/38">{a.startTime || ""}{a.venue ? " · "+a.venue : ""}</p></div>
            <ChevronRight className="h-4 w-4 text-black/20"/>
          </Link>)
        }
      </div>
    </section>

    {recentEntries.length>0 && <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="ios-section-title">Posledné EPČ</h2><Link href="/timesheet" className="text-[12px] font-semibold text-[#0a84ff]">Otvoriť</Link></div>
      <div className="apple-card overflow-hidden rounded-[24px]">{recentEntries.slice(0,3).map(e=><div key={e.id} className="flex items-center border-b border-black/[.05] px-4 py-3.5 last:border-0"><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{e.title}</p><p className="mt-0.5 text-[10px] text-black/38">{fmtDate(e.date)}</p></div><span className="text-[13px] font-bold">{Number(e.hours).toFixed(1)} h</span></div>)}</div>
    </section>}
  </div>
}

function Metric({value,label}:{value:string;label:string}) {
  return <div className="border-r border-black/[.05] p-4 text-center last:border-r-0"><p className="text-[24px] font-bold tracking-[-.03em]">{value}</p><p className="mt-1 text-[9px] font-medium text-black/38">{label}</p></div>
}
