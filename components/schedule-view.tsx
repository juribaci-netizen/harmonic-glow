"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useI18n } from "@/components/language-provider"
import { Check, X, Download, MapPin } from "lucide-react"
import { setActivityParticipation, setProgramParticipation } from '@/app/actions/schedule'
import { bratislavaNow,timeMinutes } from '@/lib/epc/model'
import { canChooseParticipation } from '@/lib/work-plan'
import type { SeasonActivity } from '@/lib/season-data-2026-27'

type Activity = {
  id: number
  date: string
  type: SeasonActivity['type']
  playing: boolean|null
  participationOverride:boolean
  workProgram: {id:string;title:string;start:string;end:string;activityIds:number[];playing:boolean|null}|null
  startTime: string | null
  endTime: string | null
  title: string
  conductor: string | null
  venue: string | null
  program: string | null
  notes: string | null
}

function ParticipationButtons({value,pending,label,onChange}:{value:boolean|null;pending:boolean;label:string;onChange:(value:boolean|null)=>void}) {
  return <div role="group" aria-label={label} className="mt-2 grid grid-cols-2 gap-2">
    {([true,false] as const).map(choice=>{
      const selected=value===choice,Icon=choice?Check:X
      return <button key={String(choice)} type="button" aria-pressed={selected} disabled={pending}
        onClick={()=>onChange(selected?null:choice)}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6f4b] disabled:opacity-50 ${selected?(choice?'border-emerald-700 bg-emerald-700 text-white':'border-rose-700 bg-rose-700 text-white'):'border-black/15 bg-white text-black/65 hover:bg-black/5'}`}>
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2.5}/>{choice?'Hrám':'Nehrám'}
      </button>
    })}
  </div>
}

function ProgramChoice({ program }: { program: NonNullable<Activity['workProgram']> }) {
  const [pending,startTransition]=useTransition(),[error,setError]=useState('')
  const choose=(value:boolean|null)=>startTransition(async()=>{
    setError('')
    try{await setProgramParticipation(program.id,value)}
    catch{setError('Výber sa nepodarilo uložiť. Skúste to znova.')}
  })
  return <div data-program-id={program.id} className={`mb-4 rounded-xl p-3 ${program.playing===false?'bg-black/5':'bg-[#f6f2ec]'}`}>
    <p className="text-[10px] font-medium uppercase tracking-wide text-[#705638]">Účasť na programe</p>
    <h2 className="mt-1 text-sm font-semibold leading-snug">{program.title}</h2>
    <p className="mt-1 text-[11px] text-black/55">{program.start.split('-').reverse().join('.')} – {program.end.split('-').reverse().join('.')}</p>
    <ParticipationButtons label={`Účasť na programe ${program.title}`} value={program.playing} pending={pending} onChange={choose}/>
    <p role="status" className="mt-2 text-[11px] leading-relaxed text-black/60 empty:hidden">{pending?'Ukladám…':''}</p>
    {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </div>
}
function ParticipationChoice({ activity }: { activity: Activity }) {
  const [pending,startTransition]=useTransition(),[error,setError]=useState('')
  return <details className="mt-3 border-t border-black/[.06] pt-2">
    <summary className="cursor-pointer text-[11px] text-black/55">{activity.participationOverride?'Výnimka: ':''}{activity.playing===true?'Hrám':activity.playing===false?'Nehrám':'Účasť nevybraná'} · upraviť túto službu</summary>
    <ParticipationButtons label={`Účasť služby ${activity.date} ${activity.startTime}`} pending={pending}
      value={activity.participationOverride?activity.playing:null}
      onChange={value=>startTransition(async()=>{setError('');try{await setActivityParticipation(activity.id,value)}catch{setError('Výber sa nepodarilo uložiť. Skúste to znova.')}})}/>
    <p role="status" className="mt-2 text-[10px] text-black/50 empty:hidden">{pending?'Ukladám…':''}</p>
    {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </details>
}

export function ScheduleView({ activities,initialNow }: { activities: Activity[];initialNow:string }) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const [now, setNow] = useState(() => new Date(initialNow))
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const civilNow=bratislavaNow(now),todayIso=civilNow.date

  const visible = useMemo(
    () => [...activities]
      .sort((a,b) => a.date.localeCompare(b.date) || (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"))
      .filter(a => {
        if (showPast) return true
        if (a.date > todayIso) return true
        if (a.date < todayIso) return false
        if (!a.startTime) return true

        const end=timeMinutes(a.endTime)??(timeMinutes(a.startTime)!+180)
        return end>civilNow.minutes
      }),
    [activities, civilNow.minutes, todayIso, showPast]
  )

  const firstInProgram=useMemo(()=>{const first=new Map<string,number>();for(const activity of visible)if(activity.workProgram&&!first.has(activity.workProgram.id))first.set(activity.workProgram.id,activity.id);return first},[visible])

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

  const relativeDayLabel = (date: string) => {
    const currentDay = new Date(todayIso+"T12:00:00Z")
    const targetDay = new Date(date + "T12:00:00Z")
    const dayDifference = Math.round((targetDay.getTime() - currentDay.getTime()) / 86_400_000)
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(dayDifference, "day")
  }

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
          </div>
          <a
            href="/api/work-plan"
            target="_blank"
            rel="noreferrer"
            aria-label="Otvoriť PDF plán práce"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform active:scale-95"
          >
            <Download className="h-[18px] w-[18px]" />
          </a>
        </div>
      </header>

      <div className="pt-4">
        <label className="flex min-h-11 items-center gap-2 text-[12px] text-black/60">
          <input type="checkbox" checked={showPast} onChange={event => setShowPast(event.target.checked)} className="h-4 w-4 accent-[#8b6f4b]"/>
          Zobraziť aj uplynulé služby
        </label>
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
                      const notPlaying=a.playing===false
                      const subdued=off||audition

                      return (
                        <article key={a.id} data-activity-id={a.id} data-not-playing={notPlaying?"":undefined} className={"px-4 py-4 "+(subdued||notPlaying?"bg-[#fafafa]":"bg-white")}>
                          {a.workProgram&&firstInProgram.get(a.workProgram.id)===a.id&&<ProgramChoice program={a.workProgram}/>}
                          <div data-activity-content className={notPlaying?"opacity-50":""}>
                          {index===0&&itemIndex===0&&<p className={"mb-1.5 text-[9px] font-semibold capitalize tracking-[.08em] "+(subdued?"text-black/28":"text-[#9a6c16]")}>{relativeDayLabel(date)}</p>}
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className={(subdued?"text-[15px] font-medium text-black/48":"text-[18px] font-semibold text-black")+" leading-tight tracking-[-.025em]"}>{label}</h3>
                            {time&&<p className={"shrink-0 tabular-nums "+(subdued?"text-[13px] font-normal text-black/38":"text-[15px] font-medium text-black/68")}>{time}</p>}
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
                          </div>
                          {canChooseParticipation(a) && <ParticipationChoice activity={a}/>}
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
