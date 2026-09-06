"use client"

import { useMemo, useState, useTransition } from "react"
import { useI18n } from "@/components/language-provider"
import { activityTypeKey, typeStyles } from "@/lib/activity-format"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react"

type Activity = {
  id: number
  date: string
  type: string
  startTime: string | null
  endTime: string | null
  title: string
  conductor: string | null
  venue: string | null
  program: string | null
}

export function ScheduleView({ activities, seedSeason }: { activities: Activity[]; seedSeason: () => Promise<{ seeded: boolean; count?: number }> }) {
  const { t, lang } = useI18n()
  const [cursor, setCursor] = useState(() => new Date())
  const [type, setType] = useState("all")
  const [isPending, startTransition] = useTransition()

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const locale = lang === "sk" ? "sk-SK" : "en-GB"
  const monthName = cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })
  const days = useMemo(() => {
    const count = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: count }, (_, i) => i + 1)
  }, [year, month])

  const visible = activities.filter((a) => {
    const d = new Date(a.date + "T00:00:00")
    return d.getFullYear() === year && d.getMonth() === month && (type === "all" || a.type === type)
  })
  const byDay = new Map<number, Activity[]>()
  visible.forEach((a) => {
    const day = Number(a.date.slice(-2))
    byDay.set(day, [...(byDay.get(day) ?? []), a])
  })

  const seed = () => startTransition(async () => { await seedSeason(); window.location.reload() })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t.orchestra}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold capitalize">{t.seasonSchedule}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.seasonSubtitle}</p>
        </div>
        {activities.length === 0 && <Button onClick={seed} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t.seedSeason}</Button>}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft /></Button>
        <div className="min-w-44 text-center font-serif text-lg font-semibold">{monthName}</div>
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight /></Button>
        <select value={type} onChange={(e) => setType(e.target.value)} className="ml-auto h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">{t.allTypes}</option>
          <option value="rehearsal">{t.type_rehearsal}</option>
          <option value="concert">{t.type_concert}</option>
          <option value="recording">{t.type_recording}</option>
          <option value="dress">{t.type_dress}</option>
          <option value="off">{t.type_off}</option>
          <option value="ip">{t.type_ip}</option>
        </select>
      </div>

      <Card className="overflow-hidden border-border">
        <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-xs font-medium text-muted-foreground">
          {t.weekdays.map((d) => <div key={d} className="px-1 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => <div key={`e${i}`} className="min-h-24 border-b border-r bg-muted/10" />)}
          {days.map((day) => {
            const items = byDay.get(day) ?? []
            return <div key={day} className="min-h-24 border-b border-r p-1.5 sm:p-2">
              <div className="mb-1 text-xs font-medium text-muted-foreground">{day}</div>
              <div className="space-y-1">
                {items.slice(0, 3).map((a) => { const s = typeStyles[a.type] ?? typeStyles.other; return <div key={a.id} className={`rounded-md border px-1.5 py-1 text-[10px] leading-tight ${s.badge}`} title={a.title}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />{a.startTime ? `${a.startTime} ` : ""}{a.title}</div> })}
                {items.length > 3 && <div className="text-[10px] text-muted-foreground">+{items.length - 3}</div>}
              </div>
            </div>
          })}
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">{monthName}</h2>
        {visible.length === 0 ? <Card className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><CalendarDays className="h-5 w-5" />{t.noUpcoming}</Card> : visible.map((a) => { const s = typeStyles[a.type] ?? typeStyles.other; return <Card key={a.id} className="p-4"><div className="flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{a.title}</p><span className={`rounded-full border px-2 py-0.5 text-[11px] ${s.badge}`}>{t[activityTypeKey[a.type] ?? "type_other"]}</span></div><p className="mt-1 text-sm text-muted-foreground">{a.date}{a.startTime ? ` · ${a.startTime}${a.endTime ? `–${a.endTime}` : ""}` : ""}{a.venue ? ` · ${a.venue}` : ""}</p>{a.conductor && <p className="mt-1 text-xs text-muted-foreground">{a.conductor}</p>}{a.program && <p className="mt-2 text-sm">{a.program}</p>}</div></div></Card> })}
      </section>
    </div>
  )
}
