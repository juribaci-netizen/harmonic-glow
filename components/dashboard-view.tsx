"use client"

import Link from "next/link"
import { useI18n } from "@/components/language-provider"
import { activityTypeKey, typeStyles } from "@/lib/activity-format"
import { Card } from "@/components/ui/card"
import { CalendarDays, Clock, ArrowRight, Music2 } from "lucide-react"

type Activity = {
  id: number
  date: string
  type: string
  startTime: string | null
  endTime: string | null
  title: string
  conductor: string | null
  venue: string | null
}

type Entry = {
  id: number
  date: string
  type: string
  title: string
  hours: string
  status: string
}

export function DashboardView({
  name,
  upcoming,
  recentEntries,
  monthHours,
  monthActivityCount,
}: {
  name: string
  upcoming: Activity[]
  recentEntries: Entry[]
  monthHours: number
  monthActivityCount: number
}) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : "en-GB"
  const firstName = name.split(" ")[0]

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", weekday: "short" })

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-muted-foreground">{t.monthOverview}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t.goodDay}, {firstName}
        </h1>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="relative overflow-hidden border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.hoursThisMonth}</p>
              <p className="mt-2 font-serif text-4xl font-semibold text-foreground">{monthHours.toFixed(1)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.logged}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.activitiesThisMonth}</p>
              <p className="mt-2 font-serif text-4xl font-semibold text-foreground">{monthActivityCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.scheduled}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-chart-2/10 text-chart-2">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">{t.upcomingActivities}</h2>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-4"
            >
              {t.viewSchedule} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card className="divide-y divide-border border-border bg-card p-0">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <Music2 className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t.noUpcoming}</p>
              </div>
            ) : (
              upcoming.map((a) => {
                const style = typeStyles[a.type] ?? typeStyles.other
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtDate(a.date)}
                        {a.startTime ? ` · ${a.startTime}` : ""}
                        {a.venue ? ` · ${a.venue}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badge}`}
                    >
                      {t[activityTypeKey[a.type] ?? "type_other"]}
                    </span>
                  </div>
                )
              })
            )}
          </Card>
        </section>

        {/* Recent entries */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">{t.recentEntries}</h2>
            <Link
              href="/timesheet"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-4"
            >
              {t.viewTimesheet} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card className="divide-y divide-border border-border bg-card p-0">
            {recentEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t.noEntries}</p>
              </div>
            ) : (
              recentEntries.map((e) => {
                const style = typeStyles[e.type] ?? typeStyles.other
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{fmtDate(e.date)}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-medium text-foreground">
                      {Number(e.hours).toFixed(1)} h
                    </span>
                  </div>
                )
              })
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}
