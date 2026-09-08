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
  const legendLabels = lang === "sk"
    ? { S:"Skúška · generálka · nahrávanie", K:"Koncert", Z:"Zájazd", A:"Konkurz" }
    : lang === "de"
      ? { S:"Probe · Generalprobe · Aufnahme", K:"Konzert", Z:"Tournee", A:"Probespiel" }
      : { S:"Rehearsal · dress rehearsal · recording", K:"Concert", Z:"Tour", A:"Audition" }

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
          const markerCounts = items.reduce<Record<string,number>>((counts,item) => {
            const code=serviceCode(item)
            if (code) counts[code]=(counts[code]??0)+1
            return counts
          },{})
          const markers = (["S","K","Z","A"] as const).filter(code=>markerCounts[code])
          return <button key={iso} onClick={()=>setSelected(iso)} className="flex h-[58px] flex-col items-center justify-center rounded-[15px]">
            <span className={"flex h-8 w-8 items-center justify-center rounded-full text-[14px] "+(active?"bg-black text-white":isToday?"ring-1 ring-black/25":"")}>{day}</span>
            <span className="mt-0.5 flex h-3 items-center gap-0.5">{markers.map(code=><i key={code} className="flex h-3 min-w-3 items-center justify-center rounded-[3px] bg-black px-0.5 text-[7px] font-semibold not-italic leading-none text-white">{code}{markerCounts[code]>1?markerCounts[code]:""}</i>)}</span>
          </button>
        })}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-black/[.05] bg-[#fafafa] px-4 py-4">
        {(["S","K","Z","A"] as const).map(code=><span key={code} className="flex min-w-0 items-center gap-2 text-[9px] text-black/48"><i className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-black text-[8px] font-semibold not-italic text-white">{code}</i><span>{legendLabels[code]}</span></span>)}
      </div>
    </section>

    <section className="mt-6">
      <p className="mb-2 px-1 text-[13px] font-medium capitalize text-black/55">{selectedDate.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})}</p>
      <div className="overflow-hidden rounded-[22px] border border-black/[.055] bg-white">
        {selectedActivities.length === 0 ? <p className="p-6 text-center text-[13px] text-black/38">Žiadne udalosti</p> : selectedActivities.map(activity=>{
          const code=serviceCode(activity)
          const activityType=code==="A"?legendLabels.A:code==="Z"?legendLabels.Z:typeLabel(activity.type)
          return <article key={activity.id} className="relative border-b border-black/[.05] px-5 py-4 last:border-0">
          <div className="flex items-center gap-2">{code&&<i className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-black text-[8px] font-semibold not-italic text-white">{code}</i>}<span className="text-[9px] uppercase tracking-[.08em] text-black/35">{activityType}</span></div>
          {activity.startTime&&<p className="mt-2 text-[24px] leading-none tracking-[-.035em]">{activity.startTime}{activity.endTime?" – "+activity.endTime:""}</p>}
          <p className="mt-1 text-[14px] text-black/72">{activity.type === "off" ? typeLabel("off") : activity.title}</p>
          {activity.venue&&<p className="mt-2 flex items-center gap-1.5 text-[10px] text-black/38"><MapPin className="h-3 w-3"/>{activity.venue}</p>}
        </article>})}
      </div>
    </section>
  </div>
}

function localIso(date:Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
}
