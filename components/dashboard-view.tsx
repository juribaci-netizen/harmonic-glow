"use client"

import Link from "next/link"
import { useI18n } from "@/components/language-provider"
import { activityTypeKey, typeStyles } from "@/lib/activity-format"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock3, ArrowRight, Music2, Plus, ChevronRight, MapPin } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({ name, today, upcoming, recentEntries, monthHours, monthActivityCount }: { name:string; today:Activity[]; upcoming:Activity[]; recentEntries:Entry[]; monthHours:number; monthActivityCount:number }) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : "en-GB"
  const firstName = name.split(" ")[0]
  const now = new Date()
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})
  const fmtDate=(d:string)=>new Date(d+"T00:00:00").toLocaleDateString(locale,{day:"numeric",month:"short",weekday:"short"})
  const next = today[0] ?? upcoming[0]

  return <div className="flex flex-col gap-5 pb-2">
    <header className="pt-1">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{todayLabel}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div><p className="text-sm text-muted-foreground">{t.goodDay}</p><h1 className="font-serif text-3xl font-semibold tracking-tight">{firstName}</h1></div>
        <div className="hidden sm:block rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">{t.orchestra}</div>
      </div>
    </header>

    <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.14em] opacity-70">{today.length ? t.today : t.upcomingActivities}</p><h2 className="mt-1 font-serif text-2xl font-semibold leading-tight">{next?.title ?? t.noUpcoming}</h2></div><div className="rounded-2xl bg-primary-foreground/10 p-2.5"><CalendarDays className="h-5 w-5"/></div></div>
      {next && <div className="mt-4 space-y-1 text-sm opacity-90"><p className="flex items-center gap-2"><Clock3 className="h-4 w-4"/>{next.startTime ? `${next.startTime}${next.endTime ? `–${next.endTime}` : ""}` : fmtDate(next.date)}</p>{next.venue && <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/>{next.venue}</p>}</div>}
      <Link href="/schedule" className="mt-5 inline-flex items-center gap-1 rounded-xl bg-primary-foreground/10 px-3 py-2 text-xs font-medium hover:bg-primary-foreground/15">{t.viewSchedule}<ChevronRight className="h-3.5 w-3.5"/></Link>
    </section>

    <div className="grid grid-cols-2 gap-3">
      <Card className="rounded-2xl p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{t.hoursThisMonth}</p><Clock3 className="h-4 w-4 text-muted-foreground"/></div><p className="mt-2 font-serif text-3xl font-semibold">{monthHours.toFixed(1)}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{t.logged}</p></Card>
      <Card className="rounded-2xl p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{t.activitiesThisMonth}</p><Music2 className="h-4 w-4 text-muted-foreground"/></div><p className="mt-2 font-serif text-3xl font-semibold">{monthActivityCount}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{t.scheduled}</p></Card>
    </div>

    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-xl font-semibold">{t.upcomingActivities}</h2><Link href="/schedule" className="text-xs font-medium text-primary">{t.viewSchedule}</Link></div>
      <Card className="overflow-hidden rounded-2xl p-0">
        {upcoming.length===0 ? <div className="flex flex-col items-center gap-2 p-8 text-center"><Music2 className="h-6 w-6 text-muted-foreground"/><p className="text-sm text-muted-foreground">{t.noUpcoming}</p></div> : upcoming.slice(0,3).map(a=>{const s=typeStyles[a.type]??typeStyles.other;return <Link href="/schedule" key={a.id} className="flex items-center gap-3 border-b p-4 last:border-0 active:bg-muted/50"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.title}</p><p className="truncate text-xs text-muted-foreground">{fmtDate(a.date)}{a.startTime?` · ${a.startTime}`:""}{a.venue?` · ${a.venue}`:""}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${s.badge}`}>{t[activityTypeKey[a.type]??"type_other"]}</span></Link>})}
      </Card>
    </section>

    <section className="grid grid-cols-2 gap-3">
      <Link href="/timesheet" className="flex items-center justify-between rounded-2xl border bg-card p-4 text-sm font-medium shadow-sm active:scale-[.99]"><span className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary"/>{t.logHours}</span><ChevronRight className="h-4 w-4 text-muted-foreground"/></Link>
      <Link href="/timesheet" className="flex items-center justify-between rounded-2xl border bg-card p-4 text-sm font-medium shadow-sm active:scale-[.99]"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary"/>{t.viewTimesheet}</span><ChevronRight className="h-4 w-4 text-muted-foreground"/></Link>
    </section>

    {recentEntries.length>0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-xl font-semibold">{t.recentEntries}</h2><Link href="/timesheet" className="text-xs font-medium text-primary">{t.viewTimesheet}</Link></div><Card className="divide-y overflow-hidden rounded-2xl p-0">{recentEntries.slice(0,3).map(e=><div key={e.id} className="flex items-center gap-3 p-4"><span className="h-2 w-2 rounded-full bg-primary"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{fmtDate(e.date)}</p></div><span className="font-mono text-sm font-semibold">{Number(e.hours).toFixed(1)} h</span></div>)}</Card></section>}
  </div>
}
