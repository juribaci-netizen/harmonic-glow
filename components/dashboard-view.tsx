"use client"

import Link from "next/link"
import { useI18n } from "@/components/language-provider"
import { CalendarDays, ClipboardCheck, PlaySquare, ChevronRight, Clock3 } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({ name, today, upcoming, monthHours, todayHours }: { name:string; today:Activity[]; upcoming:Activity[]; recentEntries:Entry[]; monthHours:number; monthActivityCount:number; monthConcertCount:number; todayHours:number }) {
  const { lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const firstName = name.split(" ")[0]
  const now = new Date()
  const next = today[0] ?? upcoming[0]
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})

  return <div className="space-y-5">
    <header className="pt-2">
      <p className="text-[11px] font-semibold capitalize text-black/38">{todayLabel}</p>
      <h1 className="ios-title mt-1">Ahoj, {firstName}</h1>
    </header>

    <section className="apple-card rounded-[28px] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-black/35">Dnes</p>
      <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-[-.025em]">{next?.title ?? "Voľno"}</h2>
      {next?.startTime && <p className="mt-2 flex items-center gap-2 text-[12px] text-black/45"><Clock3 className="h-3.5 w-3.5"/>{next.startTime}{next.endTime ? " – "+next.endTime : ""}</p>}
      <Link href="/schedule" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0a84ff]">Zobraziť plán práce<ChevronRight className="h-3.5 w-3.5"/></Link>
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

    <section className="apple-card rounded-[24px] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-black/40">Dnes odpracované</p>
          <p className="mt-1 text-[24px] font-bold tracking-[-.03em]">{todayHours.toFixed(1)} h</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f2f2f7] text-[#0a84ff]"><CalendarDays className="h-5 w-5"/></div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[.07]"><div className="h-full rounded-full bg-[#0a84ff]" style={{width:String(Math.min(100,(todayHours/8)*100))+"%"}}/></div>
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
