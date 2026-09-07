"use client"

import { useMemo, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { ChevronLeft, ChevronRight, MapPin, Music2 } from "lucide-react"

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
  notes: string | null
}

export function ScheduleView({ activities }: { activities: Activity[] }) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const today = new Date()
  const localIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + day
  }
  const todayIso = localIso(today)
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const monthActivities = useMemo(() => {
    return activities.filter((a) => {
      const d = new Date(a.date + "T00:00:00")
      return d.getFullYear() === year && d.getMonth() === month && a.date >= todayIso
    })
  }, [activities, year, month, todayIso])

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const a of monthActivities) {
      const list = map.get(a.date) ?? []
      list.push(a)
      map.set(a.date, list)
    }
    return Array.from(map.entries())
  }, [monthActivities])

  const monthName = cursor.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      rehearsal: t.type_rehearsal,
      concert: t.type_concert,
      recording: t.type_recording,
      dress: t.type_dress,
      off: t.type_off,
      ip: t.type_ip,
      other: t.type_other,
    }
    return map[type] ?? type
  }

  const timeLabel = (a: Activity) => {
    if (!a.startTime) return ""
    return a.startTime + (a.endTime ? " – " + a.endTime : "")
  }

  return (
    <div className="mx-auto w-full max-w-[430px] pb-6">
      <section className="overflow-hidden rounded-[32px] bg-[#f7f7f4] shadow-[0_12px_40px_rgba(0,0,0,.06)] ring-1 ring-black/[.05]">
        <header className="sticky top-0 z-10 border-b border-black/[.06] bg-[#f7f7f4]/95 px-5 pb-4 pt-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/45">Slovenská filharmónia</p>
              <h1 className="mt-1 font-serif text-[34px] font-semibold leading-none tracking-[-.03em]">Plán práce</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-[#d7b56d]">
              <Music2 className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[.06] active:scale-95"
              aria-label="Predchádzajúci mesiac"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-black/[.06]">
              <p className="text-[15px] font-semibold capitalize">{monthName}</p>
              <p className="mt-0.5 text-[10px] text-black/45">od dneška · celý aktuálny plán</p>
            </div>

            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[.06] active:scale-95"
              aria-label="Nasledujúci mesiac"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="px-3 pb-4 pt-3">
          {grouped.length === 0 ? (
            <div className="rounded-[24px] bg-white p-8 text-center text-sm text-black/45 ring-1 ring-black/[.05]">
              Žiadne položky v tomto mesiaci.
            </div>
          ) : (
            <div className="space-y-3">
              {grouped.map(([date, items]) => {
                const d = new Date(date + "T00:00:00")
                const weekday = d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "").toUpperCase()
                const day = d.getDate()
                const monthShort = d.toLocaleDateString(locale, { month: "short" }).replace(".", "").toUpperCase()

                return (
                  <section key={date} className="overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-black/[.05]">
                    <div className="flex border-b border-black/[.05] bg-black/[.018]">
                      <div className="flex w-[78px] shrink-0 flex-col items-center justify-center border-r border-black/[.06] py-3">
                        <span className="text-[9px] font-bold tracking-[.08em] text-black/45">{weekday}</span>
                        <span className="font-serif text-[30px] font-semibold leading-none">{day}</span>
                        <span className="mt-1 text-[9px] font-bold tracking-[.08em] text-black/45">{monthShort}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 items-center px-4">
                        <p className="text-[13px] font-semibold text-black/60">
                          {items.length === 1 ? typeLabel(items[0].type) : items.length + " frekvencie"}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-black/[.06]">
                      {items.map((a) => {
                        const cancelled = /zruš/i.test(a.title + " " + (a.notes ?? ""))
                        const off = a.type === "off"
                        const time = timeLabel(a)

                        return (
                          <article
                            key={a.id}
                            className={
                              "px-4 py-4 " +
                              (cancelled ? "bg-red-50" : off ? "bg-[#f4f1ea]" : "bg-white")
                            }
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={
                                  "mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full " +
                                  (cancelled ? "bg-red-500" : off ? "bg-black/25" : a.type === "concert" ? "bg-black" : "bg-[#d7b56d]")
                                }
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    {time && <p className="text-[15px] font-bold leading-tight">{time}</p>}
                                    <p className={"mt-0.5 text-[15px] leading-tight " + (cancelled ? "font-bold text-red-700" : "font-semibold")}>
                                      {cancelled ? "Symfónia umenia" : off ? "Voľno" : a.title}
                                    </p>
                                  </div>

                                  <span
                                    className={
                                      "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.04em] ring-1 " +
                                      (cancelled
                                        ? "bg-red-100 text-red-700 ring-red-200"
                                        : off
                                          ? "bg-black/[.04] text-black/45 ring-black/[.08]"
                                          : "bg-[#f7f7f4] text-black/55 ring-black/[.08]")
                                    }
                                  >
                                    {cancelled ? "Zrušené" : typeLabel(a.type)}
                                  </span>
                                </div>

                                {cancelled ? (
                                  <p className="mt-2 text-[12px] font-semibold text-red-700">Zrušená</p>
                                ) : !off ? (
                                  <div className="mt-2 space-y-1.5">
                                    {a.conductor && <p className="text-[12px] font-medium">Diriguje: {a.conductor}</p>}
                                    {a.venue && (
                                      <p className="flex items-center gap-1.5 text-[11px] text-black/45">
                                        <MapPin className="h-3 w-3" />
                                        {a.venue}
                                      </p>
                                    )}
                                    {a.program && <p className="text-[11px] leading-relaxed text-black/45">{a.program}</p>}
                                    {a.notes && (
                                      <p className="rounded-xl bg-black/[.035] px-3 py-2 text-[11px] leading-relaxed text-black/55">
                                        {a.notes}
                                      </p>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
