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
  const [sheetOpen, setSheetOpen] = useState(false)
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

  const moveMonth = (offset:number) => {
    const next = new Date(year, month + offset, 1)
    setCursor(next)
    setSelected(localIso(next))
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
          return <button key={iso} onClick={()=>{setSelected(iso);setSheetOpen(true)}} className="flex h-[68px] flex-col items-center justify-center rounded-[16px]">
            <span className={"flex h-9 w-9 items-center justify-center rounded-full text-[16px] "+(active?"bg-black text-white":isToday?"ring-1 ring-black/25":"")}>{day}</span>
            <span className="mt-1 flex h-3 items-center justify-center gap-1">
              {markerItems.map((item,markerIndex)=><i key={item.id+"-"+markerIndex} className="h-1.5 w-1.5 rounded-full bg-black/70" />)}
            </span>
          </button>
        })}
      </div>
    </section>

    {sheetOpen && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-0 backdrop-blur-[2px]" onClick={()=>setSheetOpen(false)}>
        <section
          className="w-full max-w-[430px] rounded-t-[30px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 shadow-[0_-18px_60px_rgba(0,0,0,.14)]"
          onClick={event=>event.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/15" />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[17px] font-medium capitalize tracking-[-.02em] text-black/78">
              {selectedDate.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})}
            </p>
            <button onClick={()=>setSheetOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f3] text-[16px] text-black/45">×</button>
          </div>

          {selectedActivities.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-black/28">Žiadne udalosti</div>
          ) : (
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
              {selectedActivities.map(activity=>{
                const code=serviceCode(activity)
                const activityType=code==="A"?"Konkurz":code==="Z"?"Zájazd":typeLabel(activity.type)
                return (
                  <article key={activity.id} className="min-w-[88%] snap-center rounded-[22px] border border-black/[.06] bg-[#fafafa] px-5 py-5">
                    <p className="text-[9px] uppercase tracking-[.1em] text-black/30">{activityType}</p>
                    {activity.startTime&&<p className="mt-2 text-[28px] font-normal leading-none tracking-[-.04em]">{activity.startTime}{activity.endTime?" – "+activity.endTime:""}</p>}
                    {activity.type === "off" ? (
                      <div className="h-8" />
                    ) : activity.program ? (
                      <details className="mt-4 border-t border-black/[.06] pt-3">
                        <summary className="cursor-pointer list-none text-[12px] font-medium text-black/52 [&::-webkit-details-marker]:hidden">Program +</summary>
                        <p className="mt-2 text-[13px] leading-[1.55] text-black/65">{activity.program}</p>
                      </details>
                    ) : (
                      <p className="mt-2 text-[14px] text-black/65">{activity.title}</p>
                    )}
                    {activity.conductor&&<p className="mt-3 text-[12px] text-black/48">Dirigent · {activity.conductor}</p>}
                    {activity.venue&&<p className="mt-2 flex items-center gap-1.5 text-[10px] text-black/35"><MapPin className="h-3 w-3"/>{activity.venue}</p>}
                  </article>
                )
              })}
            </div>
          )}
          {selectedActivities.length > 1 && <p className="mt-2 text-center text-[9px] uppercase tracking-[.1em] text-black/22">Potiahni pre ďalšiu udalosť</p>}
        </section>
      </div>
    )}
  </div>
}

function localIso(date:Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
}
