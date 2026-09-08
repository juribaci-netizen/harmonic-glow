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
}

const dotColors: Record<string,string> = {
  rehearsal: "bg-[#2474ff]", concert: "bg-black", recording: "bg-[#8b5cf6]",
  dress: "bg-[#f59e0b]", off: "bg-black/20", ip: "bg-[#22a06b]", other: "bg-[#e5484d]",
}

export function CalendarView({ activities }: { activities: Activity[] }) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(localIso(today))
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
    return [...Array(first.getDay()).fill(null), ...Array.from({length:days},(_,i)=>i+1)]
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

      <div className="grid grid-cols-7 px-3 pt-3">
        {t.weekdays.map(day=><span key={day} className="py-2 text-center text-[10px] font-medium text-black/32">{day}</span>)}
        {cells.map((day,index) => {
          if (!day) return <span key={"blank-"+index}/>
          const iso = localIso(new Date(year,month,day))
          const items = byDate.get(iso) ?? []
          const active = iso === selected
          const isToday = iso === localIso(today)
          const types = [...new Set(items.map(item=>item.type))].slice(0,3)
          return <button key={iso} onClick={()=>setSelected(iso)} className="flex h-[58px] flex-col items-center justify-center rounded-[15px]">
            <span className={"flex h-8 w-8 items-center justify-center rounded-full text-[14px] "+(active?"bg-black text-white":isToday?"ring-1 ring-black/25":"")}>{day}</span>
            <span className="mt-1 flex h-2 items-center gap-0.5">{types.map(type=><i key={type} className={"h-1.5 w-1.5 rounded-full "+dotColors[type]}/>)}</span>
          </button>
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-2 border-t border-black/[.05] px-4 py-3">
        {Object.entries(dotColors).map(([type,color])=><span key={type} className="flex items-center gap-1.5 text-[9px] text-black/42"><i className={"h-1.5 w-1.5 rounded-full "+color}/>{typeLabel(type)}</span>)}
      </div>
    </section>

    <section className="mt-6">
      <p className="mb-2 px-1 text-[13px] font-medium capitalize text-black/55">{selectedDate.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})}</p>
      <div className="overflow-hidden rounded-[22px] border border-black/[.055] bg-white">
        {selectedActivities.length === 0 ? <p className="p-6 text-center text-[13px] text-black/38">Žiadne udalosti</p> : selectedActivities.map(activity=><article key={activity.id} className="border-b border-black/[.05] px-4 py-4 last:border-0">
          <div className="flex items-center gap-2"><i className={"h-2 w-2 rounded-full "+dotColors[activity.type]}/><span className="text-[9px] uppercase tracking-[.08em] text-black/35">{typeLabel(activity.type)}</span></div>
          {activity.startTime&&<p className="mt-2 text-[24px] leading-none tracking-[-.035em]">{activity.startTime}{activity.endTime?" – "+activity.endTime:""}</p>}
          <p className="mt-1 text-[14px] text-black/72">{activity.type === "off" ? typeLabel("off") : activity.title}</p>
          {activity.venue&&<p className="mt-2 flex items-center gap-1.5 text-[10px] text-black/38"><MapPin className="h-3 w-3"/>{activity.venue}</p>}
        </article>)}
      </div>
    </section>
  </div>
}

function localIso(date:Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
}
