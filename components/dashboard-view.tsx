"use client"

import { useI18n } from "@/components/language-provider"
import { CalendarView } from "@/components/calendar-view"

type Activity = { id:number; date:string; type:string; startTime:string|null; endTime:string|null; title:string; conductor:string|null; venue:string|null; program:string|null; notes:string|null }
type Entry = { id:number; date:string; type:string; title:string; hours:string; status:string }

export function DashboardView({
  activities
}:{
  name:string
  activities:Activity[]
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
  const now = new Date()
  const locale = lang === "sk" ? "sk-SK" : lang === "de" ? "de-DE" : "en-GB"
  const todayLabel = now.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})

  return <div className="space-y-7">
    <header className="pt-2">
      <p className="modern-kicker capitalize text-black/38">{todayLabel}</p>
    </header>

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="ios-section-title">Zo Slovenskej filharmónie</h2>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <a href="https://filharmonia.sk" target="_blank" rel="noreferrer" className="w-[94%] shrink-0 snap-start overflow-hidden rounded-[22px] bg-black">
          <img src="https://raw.githubusercontent.com/juribaci-netizen/harmonic-glow/main/public/web_SF_1120x426.jpg" alt="Slovenská filharmónia – 78. koncertná sezóna 2026/27" className="block h-auto w-full" />
        </a>
        <a href="https://filharmonia.sk/61-rocnik-BHS-2026" target="_blank" rel="noreferrer" className="w-[94%] shrink-0 snap-start overflow-hidden rounded-[22px] bg-black">
          <img src="https://raw.githubusercontent.com/juribaci-netizen/harmonic-glow/main/public/BHS%202026%20banner%201120x426_0.webp" alt="Bratislavské hudobné slávnosti 2026" className="block h-auto w-full" />
        </a>
        <a href="https://filharmonia.sk/vstupenky-zoznam" target="_blank" rel="noreferrer" className="w-[94%] shrink-0 snap-start overflow-hidden rounded-[22px] bg-black">
          <img src="https://raw.githubusercontent.com/juribaci-netizen/harmonic-glow/main/public/web_SF_1120x426_ABO2.jpg" alt="Abonentky Slovenskej filharmónie – 78. koncertná sezóna" className="block h-auto w-full" />
        </a>
      </div>
    </section>

    <CalendarView activities={activities} />
  </div>
}
