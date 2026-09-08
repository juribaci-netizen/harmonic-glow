"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { useI18n } from "@/components/language-provider"

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

const serviceCode = (activity:Activity) => {
  const text = `${activity.title} ${activity.venue ?? ""}`
  if (activity.type === "off" || activity.type === "ip") return null
  if (/konkurz/i.test(text)) return "A"
  if (/zájazd|turné|odjazd|cesta|praha|žofín|hostivař/i.test(text)) return "Z"
  if (activity.type === "concert") return "K"
  return "S"
}

export function CalendarView({ activities }: { activities: Activity[] }) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(localIso(today))
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isSnapping, setIsSnapping] = useState(false)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const byDate = useMemo(() => {
    const map = new Map<string, Activity[]>()
    activities.forEach(activity => map.set(activity.date, [...(map.get(activity.date) ?? []), activity]))
    return map
  }, [activities])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const days = new Date(year, month + 1, 0).getDate()
    const mondayFirstOffset = (first.getDay() + 6) % 7
    return [...Array(mondayFirstOffset).fill(null), ...Array.from({length:days},(_,i)=>i+1)]
  }, [year, month])

  const selectedActivities = byDate.get(selected) ?? []
  const selectedDate = new Date(selected + "T00:00:00")
  const typeLabel = (type:string) => ({
    rehearsal:t.type_rehearsal, concert:t.type_concert, recording:t.type_recording,
    dress:t.type_dress, off:t.type_off, ip:t.type_ip, other:t.type_other,
  } as Record<string,string>)[type] ?? type

  const isProgramPlaceholder = (program:string) =>
    /^(Pokračovanie|Program koncertu|Dodatočne|Koncert bude|Koncert v spolupráci|Koncert v rámci|Príprava programu|Pracovný plán)/i.test(program.trim())

  const resolvedProgram = (activity:Activity) => {
    const own = activity.program?.trim()
    if (own && !isProgramPlaceholder(own)) return own

    const candidates = activities
      .filter(candidate => candidate.id !== activity.id)
      .filter(candidate => candidate.program?.trim() && !isProgramPlaceholder(candidate.program!))
      .filter(candidate => {
        if (activity.conductor) return candidate.conductor === activity.conductor
        return candidate.type === activity.type
      })
      .map(candidate => ({
        candidate,
        distance: Math.abs(new Date(candidate.date).getTime() - new Date(activity.date).getTime())
      }))
      .filter(item => item.distance <= 14*24*60*60*1000)
      .sort((a,b)=>a.distance-b.distance)

    return candidates[0]?.candidate.program?.trim() ?? null
  }

  const moveMonth = (offset:number) => {
    const next = new Date(year, month + offset, 1)
    setCursor(next)
    setSelected(localIso(next))
  }
  const commitDayChange = (offset:number) => {
    const current = new Date(selected + "T00:00:00")
    current.setDate(current.getDate() + offset)
    const nextIso = localIso(current)
    setSelected(nextIso)
    if (current.getFullYear() !== year || current.getMonth() !== month) {
      setCursor(new Date(current.getFullYear(), current.getMonth(), 1))
    }
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX === null || isSnapping) return
    const delta = event.touches[0].clientX - touchStartX
    setDragX(Math.max(-110, Math.min(110, delta)))
  }

  const handleTouchEnd = () => {
    if (touchStartX === null || isSnapping) return
    const threshold = 42
    if (Math.abs(dragX) < threshold) {
      setIsSnapping(true)
      setDragX(0)
      window.setTimeout(()=>setIsSnapping(false),180)
      setTouchStartX(null)
      return
    }

    const offset = dragX < 0 ? 1 : -1
    setIsSnapping(true)
    setDragX(dragX < 0 ? -460 : 460)

    window.setTimeout(() => {
      commitDayChange(offset)
      setDragX(dragX < 0 ? 90 : -90)
      window.requestAnimationFrame(() => {
        setDragX(0)
        window.setTimeout(()=>setIsSnapping(false),180)
      })
    }, 160)

    setTouchStartX(null)
  }

  return <div className="pb-5">
    <header className="mb-5 flex items-end justify-between pt-3">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[.14em] text-black/35">Slovenská filharmónia</p>
        <h1 className="mt-1 text-[36px] font-normal leading-none tracking-[-.05em]">{t.calendar}</h1>
      </div>
    </header>

    <section className="overflow-hidden rounded-[24px] border border-black/[.06] bg-white shadow-[0_12px_36px_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between border-b border-black/[.05] px-4 py-4">
        <button onClick={()=>moveMonth(-1)} aria-label="Predchádzajúci mesiac" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f4f5]"><ChevronLeft className="h-4 w-4"/></button>
        <p className="text-[17px] font-medium capitalize">{cursor.toLocaleDateString(locale,{month:"long",year:"numeric"})}</p>
        <button onClick={()=>moveMonth(1)} aria-label="Nasledujúci mesiac" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f4f5]"><ChevronRight className="h-4 w-4"/></button>
      </div>

      <div className="grid grid-cols-7 px-3.5 pb-3 pt-4">
        {t.weekdays.map(day=><span key={day} className="py-2.5 text-center text-[11px] font-medium text-black/32">{day}</span>)}
        {cells.map((day,index) => {
          if (!day) return <span key={"blank-"+index}/>
          const iso = localIso(new Date(year,month,day))
          const items = byDate.get(iso) ?? []
          const active = iso === selected
          const isToday = iso === localIso(today)
          const markerItems = items.filter(item => item.type !== "off" && item.type !== "ip")
          return <button key={iso} onClick={()=>setSelected(iso)} className="flex h-[68px] flex-col items-center justify-center rounded-[16px]">
            <span className={"flex h-9 w-9 items-center justify-center rounded-full text-[16px] "+(active?"bg-black text-white":isToday?"ring-1 ring-black/25":"")}>{day}</span>
            <span className="mt-1 flex h-3 items-center justify-center gap-1">
              {markerItems.map((item,markerIndex)=><i key={item.id+"-"+markerIndex} className="h-1.5 w-1.5 rounded-full bg-black/70" />)}
            </span>
          </button>
        })}
      </div>
    </section>

    <section
      className="mt-4 overflow-hidden rounded-[26px] border border-black/[.05] bg-white shadow-[0_18px_50px_rgba(0,0,0,.065)]"
      onTouchStart={event=>{if(!isSnapping){setTouchStartX(event.touches[0].clientX);setDragX(0)}}}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{touchAction:"pan-y"}}
    >
      <div
        className={isSnapping ? "transition-transform duration-200 ease-out" : ""}
        style={{transform:`translate3d(${dragX}px,0,0)`}}
      >
      <div className="px-5 pt-4">
        <p className="text-[11px] font-medium capitalize text-black/38">
          {selectedDate.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})}
        </p>
      </div>

      <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.22,1,.36,1)]" style={{gridTemplateRows:selectedActivities.length?"1fr":"0fr"}}>
        <div className="overflow-hidden">
          {selectedActivities.length===0 ? (
            <div className="px-5 pb-5 pt-3 text-[12px] text-black/28">Žiadne udalosti</div>
          ) : (
            <div className="divide-y divide-black/[.05]">
              {selectedActivities.map(activity=>{
                const code=serviceCode(activity)
                const activityType=code==="A"?"Konkurz":code==="Z"?"Zájazd":typeLabel(activity.type)
                const program=resolvedProgram(activity)
                return (
                  <article key={activity.id} className="px-5 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-[10px] uppercase tracking-[.09em] text-black/28">{activityType}</p>
                      {activity.startTime&&<p className="text-[24px] font-normal tracking-[-.035em] text-black">{activity.startTime}{activity.endTime?" – "+activity.endTime:""}</p>}
                    </div>
                    {activity.type!=="off" && (
                      <>
                        {code==="A" && <p className="mt-2 text-[14px] leading-snug text-black/72">{activity.title}</p>}
                        {program ? (
                          <details className="mt-3">
                            <summary className="cursor-pointer list-none text-[11px] font-medium text-black/48 [&::-webkit-details-marker]:hidden">Program +</summary>
                            <p className="mt-2 text-[12px] leading-[1.55] text-black/58">{program}</p>
                          </details>
                        ) : code!=="A" ? (
                          <p className="mt-2 text-[14px] leading-snug text-black/72">{activity.title}</p>
                        ) : null}
                      </>
                    )}
                    {activity.conductor&&<p className="mt-3 text-[11px] text-black/42">Dirigent · {activity.conductor}</p>}
                    {activity.venue&&<p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-black/32"><MapPin className="h-3 w-3"/>{activity.venue}</p>}
                  </article>
                )
              })}
            </div>
          )}
          <div className="px-5 pb-4 pt-1 text-center text-[9px] text-black/16">‹  ›</div>
        </div>
      </div>
      </div>
    </section>
  </div>
}

function localIso(date:Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
}
