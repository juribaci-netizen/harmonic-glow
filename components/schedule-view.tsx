"use client"

import { useMemo, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"

type Activity={
  id:number
  date:string
  type:string
  startTime:string|null
  endTime:string|null
  title:string
  conductor:string|null
  venue:string|null
  program:string|null
  notes:string|null
}

export function ScheduleView({activities}:{activities:Activity[]}) {
  const { t, lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const [cursor,setCursor] = useState(()=>new Date(2026,8,1))
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const visible = useMemo(
    () => activities.filter(a => {
      const d = new Date(a.date + "T00:00:00")
      return d.getFullYear() === year && d.getMonth() === month
    }),
    [activities, year, month]
  )

  const monthName = cursor.toLocaleDateString(locale,{month:"long",year:"numeric"})
  const fmtTime=(a:Activity)=>a.startTime ? a.startTime + (a.endTime ? " – " + a.endTime : "") : ""
  const typeLabel=(type:string)=>{
    const map:Record<string,string>={
      rehearsal:t.type_rehearsal,
      concert:t.type_concert,
      recording:t.type_recording,
      dress:t.type_dress,
      off:t.type_off,
      ip:t.type_ip,
      other:t.type_other,
    }
    return map[type] ?? type
  }

  return <div className="flex flex-col gap-5 pb-4">
    <header>
      <h1 className="font-serif text-[30px] font-semibold">Plán práce</h1>
      <p className="mt-1 text-xs text-muted-foreground">24. 8. 2026 – 3. 1. 2027 · Slovenská filharmónia</p>
    </header>

    <div className="flex items-center justify-between">
      <Button variant="outline" size="icon" className="rounded-xl" onClick={()=>setCursor(new Date(year,month-1,1))}><ChevronLeft/></Button>
      <p className="font-semibold capitalize">{monthName}</p>
      <Button variant="outline" size="icon" className="rounded-xl" onClick={()=>setCursor(new Date(year,month+1,1))}><ChevronRight/></Button>
    </div>

    <section className="space-y-3">
      {visible.length===0 ? (
        <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground">Žiadne položky v tomto mesiaci.</Card>
      ) : visible.map(a=>{
        const d = new Date(a.date+"T00:00:00")
        const day = d.toLocaleDateString(locale,{weekday:"short"}).toUpperCase()
        const num = d.getDate()
        const mon = d.toLocaleDateString(locale,{month:"short"}).toUpperCase()
        const cancelled = /zruš/i.test((a.title+" "+(a.notes??"")))
        const off = a.type==="off"

        return <Card key={a.id} className={"rounded-2xl p-4 shadow-none " + (cancelled ? "border-red-300 bg-red-50/90" : "")}>
          <div className="flex gap-4">
            <div className="w-14 shrink-0 border-r pr-3 text-center">
              <p className="text-[9px] font-semibold text-muted-foreground">{day}</p>
              <p className="font-serif text-2xl font-semibold leading-none">{num}</p>
              <p className="mt-1 text-[9px] font-semibold text-muted-foreground">{mon}</p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {fmtTime(a) && <p className="text-sm font-semibold">{fmtTime(a)}</p>}
                  <p className={"text-sm " + (cancelled ? "font-semibold text-red-700" : "font-medium")}>
                    {cancelled ? "Symfónia umenia" : off ? "Voľno" : a.title}
                  </p>
                </div>
                <span className={"rounded-full border px-2 py-1 text-[10px] font-medium " + (cancelled ? "border-red-300 bg-red-100 text-red-700" : "bg-background")}>
                  {cancelled ? "ZRUŠENÉ" : typeLabel(a.type)}
                </span>
              </div>

              {cancelled ? (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-red-700">Zrušená</p>
              ) : !off ? (
                <>
                  {a.conductor && <p className="mt-2 text-[11px] font-medium">Diriguje: {a.conductor}</p>}
                  {a.venue && <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3"/>{a.venue}</p>}
                  {a.program && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.program}</p>}
                  {a.notes && <p className="mt-2 rounded-lg bg-muted p-2 text-[11px] leading-relaxed text-muted-foreground">{a.notes}</p>}
                </>
              ) : null}
            </div>
          </div>
        </Card>
      })}
    </section>
  </div>
}
