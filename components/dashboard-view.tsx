"use client"

import Link from "next/link"
import { useI18n } from "@/components/language-provider"
import { activityTypeKey, typeStyles } from "@/lib/activity-format"
import { Card } from "@/components/ui/card"
import { CalendarDays, Clock3, ArrowRight, Music2, Plus, ChevronRight, MapPin } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({ name, today, upcoming, recentEntries, monthHours, monthActivityCount }: { name:string; today:Activity[]; upcoming:Activity[]; recentEntries:Entry[]; monthHours:number; monthActivityCount:number }) {
  const { t, lang } = useI18n(); const locale = lang === "sk" ? "sk-SK" : "en-GB"; const firstName = name.split(" ")[0]; const now = new Date()
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"}); const fmtDate=(d:string)=>new Date(d+"T00:00:00").toLocaleDateString(locale,{day:"numeric",month:"short"}); const next=today[0]??upcoming[0]
  return <div className="flex flex-col gap-5 pb-3">
    <header className="pt-1"><p className="text-[11px] font-medium text-muted-foreground">{todayLabel}</p><div className="mt-2"><p className="text-sm text-muted-foreground">{t.goodDay}</p><h1 className="font-serif text-[28px] font-semibold tracking-tight">{firstName}</h1></div></header>

    <section className="rounded-[18px] bg-[#17233d] p-5 text-white shadow-sm">
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">{t.today}</p><h2 className="mt-1 text-[19px] font-semibold leading-tight">{next?.title??t.noUpcoming}</h2></div><CalendarDays className="h-5 w-5 text-white/75"/></div>
      {next?<div className="mt-4 space-y-1.5 text-xs text-white/80"><p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5"/>{next.startTime?`${next.startTime}${next.endTime?` – ${next.endTime}`:""}`:fmtDate(next.date)}</p>{next.venue&&<p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/>{next.venue}</p>}</div>:<Link href="/schedule" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs">{t.viewSchedule}<ChevronRight className="h-3.5 w-3.5"/></Link>}
      {next&&<Link href="/schedule" className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-white/80">{t.viewSchedule}<ArrowRight className="h-3 w-3"/></Link>}
    </section>

    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-[19px] font-semibold">{t.today} {t.hoursThisMonth.toLowerCase()}</h2></div><div className="grid grid-cols-3 gap-2.5"><Card className="rounded-xl border-0 bg-[#edf8f2] p-3 text-center shadow-none"><p className="font-serif text-[22px] font-semibold text-emerald-800">{monthHours.toFixed(1)}</p><p className="mt-0.5 text-[10px] text-emerald-700">{t.hoursThisMonth}</p></Card><Card className="rounded-xl border-0 bg-[#eef4ff] p-3 text-center shadow-none"><p className="font-serif text-[22px] font-semibold text-blue-800">{monthActivityCount}</p><p className="mt-0.5 text-[10px] text-blue-700">{t.schedule}</p></Card><Card className="rounded-xl border-0 bg-[#fff0f2] p-3 text-center shadow-none"><p className="font-serif text-[22px] font-semibold text-rose-700">{upcoming.filter(a=>a.type==="concert").length}</p><p className="mt-0.5 text-[10px] text-rose-700">{t.type_concert}</p></Card></div></section>

    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-[19px] font-semibold">{t.upcomingActivities}</h2><Link href="/schedule" className="text-xs font-medium text-primary">{t.viewSchedule}</Link></div><Card className="overflow-hidden rounded-2xl p-0">{upcoming.length===0?<div className="flex flex-col items-center gap-2 p-8 text-center"><Music2 className="h-6 w-6 text-muted-foreground"/><p className="text-sm text-muted-foreground">{t.noUpcoming}</p></div>:upcoming.slice(0,4).map(a=>{const s=typeStyles[a.type]??typeStyles.other;return <Link href="/schedule" key={a.id} className="flex items-center gap-3 border-b p-3.5 last:border-0 active:bg-muted/50"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.title}</p><p className="truncate text-[11px] text-muted-foreground">{fmtDate(a.date)}{a.startTime?` · ${a.startTime}`:""}{a.venue?` · ${a.venue}`:""}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${s.badge}`}>{t[activityTypeKey[a.type]??"type_other"]}</span></Link>})}</Card></section>

    <section className="grid grid-cols-2 gap-2.5"><Link href="/timesheet" className="flex items-center justify-center gap-2 rounded-xl bg-[#17233d] p-3.5 text-xs font-semibold text-white shadow-sm active:scale-[.99]"><Plus className="h-4 w-4"/>{t.logHours}</Link><Link href="/timesheet" className="flex items-center justify-center gap-2 rounded-xl border bg-card p-3.5 text-xs font-semibold active:scale-[.99]"><Clock3 className="h-4 w-4 text-primary"/>{t.viewTimesheet}</Link></section>

    {recentEntries.length>0&&<section><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-[19px] font-semibold">{t.recentEntries}</h2><Link href="/timesheet" className="text-xs font-medium text-primary">{t.viewTimesheet}</Link></div><Card className="divide-y overflow-hidden rounded-2xl p-0">{recentEntries.slice(0,3).map(e=><div key={e.id} className="flex items-center gap-3 p-3.5"><span className="h-2 w-2 rounded-full bg-primary"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{e.title}</p><p className="text-[11px] text-muted-foreground">{fmtDate(e.date)}</p></div><span className="font-mono text-sm font-semibold">{Number(e.hours).toFixed(1)} h</span></div>)}</Card></section>}
  </div>
}
