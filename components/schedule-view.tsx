"use client"

import { useMemo } from "react"
import { useI18n } from "@/components/language-provider"
import { MapPin, Music2 } from "lucide-react"

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

  const localIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + day
  }

  const todayIso = localIso(new Date())

  const visible = useMemo(
    () => activities
      .filter(a => a.date >= todayIso)
      .sort((a,b) => a.date.localeCompare(b.date) || (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99")),
    [activities, todayIso]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const a of visible) {
      const list = map.get(a.date) ?? []
      list.push(a)
      map.set(a.date, list)
    }
    return Array.from(map.entries())
  }, [visible])

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

  const timeLabel = (a: Activity) =>
    a.startTime ? a.startTime + (a.endTime ? " – " + a.endTime : "") : ""

  return (
    <div className="mx-auto w-full max-w-[430px] pb-6">
      <header className="sticky top-14 z-20 -mx-5 border-b border-black/[.05] bg-white/92 px-5 pb-4 pt-3 backdrop-blur-2xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[.14em] text-black/35">Slovenská filharmónia</p>
            <h1 className="mt-1 text-[36px] font-normal leading-none tracking-[-.05em]">Plán práce</h1>
            <p className="mt-2 text-[11px] text-black/38">Od dneška až do 3. januára 2027</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
            <Music2 className="h-4 w-4" />
          </div>
        </div>
      </header>

      <div className="pt-4">
        {grouped.map(([date, items], index) => {
          const d = new Date(date + "T00:00:00")
          const monthChanged = index === 0 || grouped[index-1][0].slice(0,7) !== date.slice(0,7)

          return (
            <div key={date}>
              {monthChanged && (
                <div className="sticky top-[134px] z-10 -mx-1 mb-2 mt-6 bg-white/92 px-1 py-2 backdrop-blur-xl first:mt-0">
                  <p className="text-[14px] font-medium capitalize tracking-[-.02em]">
                    {d.toLocaleDateString(locale,{month:"long",year:"numeric"})}
                  </p>
                </div>
              )}

              <section className="mb-3 overflow-hidden rounded-[22px] border border-black/[.055] bg-white shadow-[0_10px_30px_rgba(0,0,0,.03)]">
                <div className="flex">
                  <div className="flex w-[76px] shrink-0 flex-col items-center justify-center border-r border-black/[.05] bg-[#f7f7f8] py-3">
                    <span className="text-[10px] font-normal uppercase tracking-[.05em] text-black/38">
                      {d.toLocaleDateString(locale,{weekday:"short"}).replace(".","")}
                    </span>
                    <span className="text-[38px] font-normal leading-none tracking-[-.04em]">{d.getDate()}</span>
                    <span className="mt-1 text-[10px] font-normal uppercase tracking-[.05em] text-black/38">
                      {d.toLocaleDateString(locale,{month:"short"}).replace(".","")}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 divide-y divide-black/[.05]">
                    {items.map(a => {
                      const off=a.type==="off"
                      const audition=/konkurz/i.test(a.title)
                      const cancelled=/zruš/i.test((a.title||"")+" "+(a.notes||""))
                      const time=timeLabel(a)

                      return (
                        <article key={a.id} className={"px-4 py-3.5 "+(off?"bg-[#fafafa]":"bg-white")}>
                          {time && (
                            <p className={"text-[24px] font-normal leading-none tracking-[-.035em] "+(audition?"text-[#d43a2f]":"text-black")}>
                              {time}
                            </p>
                          )}
                          <p className={"mt-1 text-[14px] font-normal leading-snug "+(audition?"text-[#d43a2f]":"text-black/72")}>
                            {cancelled ? "Zrušená" : off ? "Voľno" : a.title}
                          </p>

                          {!off && !cancelled && (
                            <div className="mt-2 space-y-1.5">
                              {a.conductor && <p className="text-[11px] text-black/52">Diriguje: {a.conductor}</p>}
                              {a.venue && <p className="flex items-center gap-1.5 text-[10px] text-black/38"><MapPin className="h-3 w-3"/>{a.venue}</p>}
                              {a.program && <details className="pt-1">
                                <summary className="cursor-pointer list-none text-[10px] font-medium text-black/48">Program +</summary>
                                <p className="mt-2 text-[10px] leading-5 text-black/42">{a.program}</p>
                              </details>}
                              {a.notes && <p className="text-[10px] leading-5 text-black/42">{a.notes}</p>}
                            </div>
                          )}

                          <p className="mt-2 text-[9px] uppercase tracking-[.08em] text-black/25">{typeLabel(a.type)}</p>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </section>
            </div>
          )
        })}
      </div>
    </div>
  )
}
