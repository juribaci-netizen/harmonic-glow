"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useI18n } from "@/components/language-provider"
import { CalendarDays, ChevronRight, Clock3, MapPin, Play } from "lucide-react"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({
  name, upcoming, weekActivities
}:{
  name:string
  today:Activity[]
  upcoming:Activity[]
  weekActivities:Activity[]
  recentEntries:Entry[]
  monthHours:number
  monthActivityCount:number
  monthConcertCount:number
  todayHours:number
}) {
  const { lang } = useI18n()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const now = new Date()
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})

  const days = useMemo(()=>{
    const start = new Date(now)
    start.setHours(0,0,0,0)
    return Array.from({length:7},(_,i)=>{
      const d = new Date(start)
      d.setDate(start.getDate()+i)
      return d
    })
  },[])

  const localIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + day
  }

  return <div className="space-y-7">
    <header className="pt-2">
      <p className="modern-kicker capitalize text-black/38">{todayLabel}</p>
    </header>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Zo Slovenskej filharmónie</h2>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <a href="https://filharmonia.sk/61-rocnik-BHS-2026" target="_blank" rel="noreferrer" className="w-[94%] shrink-0 snap-start overflow-hidden rounded-[22px] bg-black">
          <img src="/BHS%202026%20banner%201120x426_0.webp" alt="Bratislavské hudobné slávnosti 2026" className="block h-auto w-full" />
        </a>
        <a href="https://filharmonia.sk/vstupenky-zoznam" target="_blank" rel="noreferrer" className="w-[94%] shrink-0 snap-start overflow-hidden rounded-[22px] bg-black">
          <img src="/web_SF_1120x426_ABO2.jpg" alt="Abonentky Slovenskej filharmónie – 78. koncertná sezóna" className="block h-auto w-full" />
        </a>
      </div>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Plán práce</h2>
        <Link href="/schedule" className="text-[12px] font-medium text-black">Plán práce</Link>
      </div>

      <div className="space-y-3">
        <DayPreview
          title="Dnes"
          date={days[0]}
          activities={weekActivities.filter(a=>a.date===localIso(days[0]))}
          locale={locale}
        />

        <DayPreview
          title="Zajtra"
          date={days[1]}
          activities={weekActivities.filter(a=>a.date===localIso(days[1]))}
          locale={locale}
        />

        <details className="apple-card overflow-hidden rounded-[20px]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
            <div>
              <p className="text-[20px] font-normal">Celý týždeň projektu</p>
              <p className="mt-1 text-[10px] text-black/38">Dnešný deň + nasledujúcich 6 dní</p>
            </div>
            <ChevronRight className="h-4 w-4 text-black/25 transition group-open:rotate-90"/>
          </summary>

          <div className="border-t border-black/[.06]">
            {days.map(d=>{
              const iso=localIso(d)
              const items=weekActivities.filter(a=>a.date===iso)
              return <div key={iso} className="border-b border-black/[.05] px-4 py-3.5 last:border-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-[12px] font-medium capitalize">{d.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"short"})}</p>
                  <span className="text-[9px] font-medium uppercase tracking-[.06em] text-black/30">{items.length>1?items.length+" frekvencie":items.length===1?"1 frekvencia":"voľno"}</span>
                </div>
                {items.length===0 ? <p className="mt-2 text-[12px] text-black/38">Voľno</p> :
                  <div className="mt-2 space-y-2">
                    {items.map(a=><div key={a.id} className="rounded-[12px] bg-[#f5f5f7] px-3 py-2.5">
                      {a.startTime&&<p className={"text-[20px] font-normal "+(/konkurz/i.test(a.title)?"text-[#d43a2f]":"text-black")}>{a.startTime}{a.endTime?" – "+a.endTime:""}</p>}
                      <p className={"mt-0.5 text-[12px] font-medium "+(/konkurz/i.test(a.title)?"text-[#d43a2f]":"text-black/65")}>{a.type==="off"?"Voľno":a.title}</p>
                    </div>)}
                  </div>
                }
              </div>
            })}
          </div>
        </details>

        <a href="/Pracovny-plan-SF-24-8-2026-3-1-2027.pdf" target="_blank" rel="noreferrer" className="apple-card flex items-center justify-between rounded-[20px] px-4 py-4">
          <div>
            <p className="text-[20px] font-normal">Celý plán práce</p>
            <p className="mt-1 text-[10px] text-black/38">Originálny pracovný plán · PDF</p>
          </div>
          <ChevronRight className="h-4 w-4 text-black/25"/>
        </a>
      </div>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Náhľad</h2>
      </div>

      <Link href="/videos" className="group block overflow-hidden rounded-[20px] bg-black shadow-[0_10px_30px_rgba(0,0,0,.10)]">
        <div className="relative aspect-[16/9]">
          <img src="https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5"/>
          <span className="absolute left-4 top-4 rounded-full bg-black/35 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[.08em] text-white/80 backdrop-blur-md">Posledné</span>
          <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"><Play className="ml-0.5 h-4 w-4 fill-current"/></span>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-[11px] font-medium text-white/60">21. jún 2026</p>
            <h3 className="mt-1 text-[22px] font-medium tracking-[-.035em]">Mozart</h3>
            <p className="mt-1 text-[11px] text-white/65">SKO · SFZ · Danel · Sedlický</p>
          </div>
        </div>
      </Link>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Najbližšie</h2>
        <Link href="/schedule" className="text-[12px] font-medium text-black">Všetko</Link>
      </div>
      <div className="apple-card overflow-hidden rounded-[20px]">
        {upcoming.length===0 ? <p className="p-6 text-center text-[13px] text-black/40">Žiadne nadchádzajúce aktivity</p> :
          upcoming.slice(0,3).map(a=><Link href="/schedule" key={a.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] bg-[#f4f4f5]">
              <span className="text-[8px] font-medium uppercase text-black/34">{new Date(a.date+"T00:00:00").toLocaleDateString(locale,{month:"short"})}</span>
              <span className="text-[26px] font-normal leading-none">{new Date(a.date+"T00:00:00").getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={"truncate text-[13px] font-medium "+(/konkurz/i.test(a.title)?"text-[#d43a2f]":"")}>{a.title}</p>
              {a.startTime&&<p className={"mt-1 text-[20px] font-normal tracking-[-.01em] "+(/konkurz/i.test(a.title)?"text-[#d43a2f]":"")}>{a.startTime}{a.endTime?" – "+a.endTime:""}</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-black/18"/>
          </Link>)
        }
      </div>
    </section>
  </div>
}


function DayPreview({title,date,activities,locale}:{title:string;date:Date;activities:Activity[];locale:string}) {
  return <div className="apple-card rounded-[20px] p-4">
    <div className="flex items-baseline justify-between">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[.08em] text-black/35">{title}</p>
        <p className="mt-1 text-[20px] font-normal capitalize tracking-[-.02em]">{date.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>
      <span className="text-[9px] font-medium text-black/28">{activities.length>1?activities.length+" frekvencie":activities.length===1?"1 frekvencia":"voľno"}</span>
    </div>

    {activities.length===0 ? <p className="mt-3 text-[13px] text-black/40">Voľno</p> :
      <div className="mt-3 space-y-2">
        {activities.map(a=><div key={a.id} className="rounded-[14px] bg-[#f4f4f5] px-3.5 py-3">
          {a.startTime&&<p className={"flex items-center gap-2 text-[24px] font-normal tracking-[-.02em] "+(/konkurz/i.test(a.title)?"text-[#d43a2f]":"text-black")}><Clock3 className="h-4 w-4"/>{a.startTime}{a.endTime?" – "+a.endTime:""}</p>}
          <p className={"mt-1 text-[13px] font-medium "+(/konkurz/i.test(a.title)?"text-[#d43a2f]":"text-black/65")}>{a.type==="off"?"Voľno":a.title}</p>
          {a.venue&&<p className="mt-1 flex items-center gap-1.5 text-[10px] text-black/40"><MapPin className="h-3 w-3"/>{a.venue}</p>}
        </div>)}
      </div>
    }
  </div>
}
