"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { Download, MapPin } from "lucide-react"

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
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const localIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + day
  }

  const todayIso = localIso(now)

  const visible = useMemo(
    () => [...activities]
      .sort((a,b) => a.date.localeCompare(b.date) || (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"))
      .filter(a => {
        if (a.date > todayIso) return true
        if (a.date < todayIso) return false
        if (!a.startTime) return true

        const end = new Date(`${a.date}T${a.endTime ?? a.startTime}:00`)
        if (!a.endTime) end.setHours(end.getHours() + 3)
        return end.getTime() > now.getTime()
      }),
    [activities, now, todayIso]
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

  const staffingLabel = (a: Activity) => {
    const text = [a.program, a.notes].filter(Boolean).join(" ")
    return text.match(/Obsadenie(?:\s+sláčikov)?\s+[^.]+\.?/i)?.[0] ?? null
  }

  const cleanProgram = (a: Activity) =>
    a.program?.replace(/Obsadenie(?:\s+sláčikov)?\s+[^.]+\.?/i, "").replace(/\s+/g, " ").trim() || null

  const isProgramPlaceholder = (program: string) =>
    /^(Program koncertu|Pokračovanie|Dodatočne|Koncert bude|Koncert v spolupráci|Koncert v rámci|Koncert v Prahe|Koncert k Roku|Vianočné koncerty|Príprava programu|Pracovný plán)/i.test(program)

  const resolvedProgram = (a: Activity) => {
    const own = cleanProgram(a)
    if (own && !isProgramPlaceholder(own)) return own

    const candidates = activities
      .filter(candidate => candidate.id !== a.id)
      .map(candidate => ({ activity: candidate, program: cleanProgram(candidate) }))
      .filter(candidate => candidate.program && !isProgramPlaceholder(candidate.program))
      .filter(candidate => {
        if (a.conductor) return candidate.activity.conductor === a.conductor
        return a.type === "recording" && candidate.activity.type === "recording"
      })
      .map(candidate => ({
        ...candidate,
        distance: Math.abs(new Date(candidate.activity.date).getTime() - new Date(a.date).getTime()),
      }))
      .filter(candidate => candidate.distance <= 14 * 24 * 60 * 60 * 1000)
      .sort((left,right) => left.distance - right.distance)

    return candidates[0]?.program ?? null
  }

  const cleanNotes = (a: Activity) =>
    a.notes?.replace(/Obsadenie(?:\s+sláčikov)?\s+[^.]+\.?/i, "").replace(/\s+/g, " ").trim() || null

  return (
    <div className="mx-auto w-full max-w-[430px] pb-6">
      <header className="sticky top-14 z-20 -mx-5 border-b border-black/[.05] bg-white/92 px-5 pb-4 pt-3 backdrop-blur-2xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[.14em] text-black/35">Slovenská filharmónia</p>
            <h1 className="mt-1 text-[36px] font-normal leading-none tracking-[-.05em]">Plán práce</h1>
            <p className="mt-2 text-[11px] text-black/38">Najbližšie služby podľa aktuálneho času</p>
          </div>
          <a
            href="https://raw.githubusercontent.com/juribaci-netizen/harmonic-glow/main/public/work-plan-2026-2027.pdf"
            target="_blank"
            rel="noreferrer"
            aria-label="Otvoriť PDF plán práce"
            title="Otvoriť PDF plán práce"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform active:scale-95"
          >
            <Download className="h-[18px] w-[18px]" />
          </a>
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

              <section className="mb-3 overflow-hidden rounded-[20px] border border-black/[.07] bg-white">
                <div className="flex">
                  <div className="flex w-[66px] shrink-0 flex-col items-center justify-start border-r border-black/[.06] bg-[#f7f7f8] py-4">
                    <span className="text-[10px] font-normal uppercase tracking-[.05em] text-black/38">
                      {d.toLocaleDateString(locale,{weekday:"short"}).replace(".","")}
                    </span>
                    <span className="text-[34px] font-normal leading-none tracking-[-.04em]">{d.getDate()}</span>
                    <span className="mt-1 text-[10px] font-normal uppercase tracking-[.05em] text-black/38">
                      {d.toLocaleDateString(locale,{month:"short"}).replace(".","")}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 divide-y divide-black/[.05]">
                    {items.map((a,itemIndex) => {
                      const off=a.type==="off"
                      const audition=/konkurz/i.test(a.title)
                      const cancelled=/zruš/i.test((a.title||"")+" "+(a.notes||""))
                      const time=timeLabel(a)
                      const staffing=staffingLabel(a)
                      const program=resolvedProgram(a)
                      const notes=cleanNotes(a)
                      const label=cancelled ? "Zrušená" : off ? "Voľno" : audition ? a.title : typeLabel(a.type)
                      const repeatedTitle=a.title.trim().toLocaleLowerCase(locale)===label.trim().toLocaleLowerCase(locale)

                      return (
                        <article key={a.id} className={"px-4 py-4 "+(off?"bg-[#fafafa]":"bg-white")}>
                          {index===0&&itemIndex===0&&<p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[.12em] text-[#9a6c16]">Najbližšie</p>}
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className={"text-[18px] font-semibold leading-tight tracking-[-.025em] "+(audition?"text-[#9b5838]":"text-black")}>{label}</h3>
                            {time&&<p className="shrink-0 text-[15px] font-medium tabular-nums text-black/68">{time}</p>}
                          </div>

                          {!off&&!cancelled&&!repeatedTitle&&<p className="mt-1 text-[12px] leading-snug text-black/48">{a.title}</p>}

                          {!off&&!cancelled&&a.conductor&&(
                            <p className="mt-2 text-[13px] font-medium text-black/72">
                              <span className="font-normal text-black/35">Dirigent</span> · {a.conductor}
                            </p>
                          )}

                          {!off && !cancelled && program && (
                            <details className="mt-3 border-t border-black/[.06] pt-3">
                              <summary className="cursor-pointer list-none text-[11px] font-medium text-black/52 [&::-webkit-details-marker]:hidden">Program +</summary>
                              <p className="mt-2 text-[13px] leading-[1.55] text-black/78">{program}</p>
                            </details>
                          )}

                          {!off && !cancelled && staffing && (
                            <div className="mt-3 rounded-xl bg-[#f1f1ef] px-3 py-2.5">
                              <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-black/38">Obsadenie</p>
                              <p className="mt-1 text-[13px] font-medium text-black/75">{staffing.replace(/^Obsadenie(?:\s+sláčikov)?\s*/i, "")}</p>
                            </div>
                          )}

                          {!off && !cancelled && (a.venue || notes) && (
                            <div className="mt-3 space-y-1 text-[10px] leading-relaxed text-black/42">
                              {a.venue&&<p className="flex items-center gap-1.5"><MapPin className="h-3 w-3"/>{a.venue}</p>}
                              {notes&&<p>{notes}</p>}
                            </div>
                          )}
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
