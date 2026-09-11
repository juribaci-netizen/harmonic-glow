"use client"

import { useI18n } from "@/components/language-provider"
import { Mail, Phone, Music2, MapPin, CalendarDays, Globe2, ChevronRight, Bell } from "lucide-react"

type Profile={fullName:string|null;instrument:string|null;section:string|null;position:string|null;phone:string|null}

export function ProfileView({user,profile}:{user:{name:string;email:string};profile:Profile|null}) {
  const {lang}=useI18n()
  const fullName=profile?.fullName??user.name
  const instrument=profile?.instrument??"Husle"
  const section=profile?.section??"Prvé husle"
  const phone=profile?.phone??"—"

  return <div className="space-y-6 text-[#292620]">
    <header className="pt-2"><h1 className="text-[24px] font-semibold tracking-[-.035em]">Profil</h1></header>

    <section className="rounded-[20px] border border-[#8b6f4b]/15 bg-[#faf8f5] px-5 py-6 shadow-[0_2px_8px_rgba(62,48,30,0.025)]">
      <div className="flex items-center gap-4 max-[360px]:flex-col max-[360px]:items-start">
        <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#8b6f4b] text-white"><Music2 className="h-7 w-7" strokeWidth={1.7}/></div>
        <div className="min-w-0"><h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-.035em] [overflow-wrap:anywhere]">{fullName}</h2><p className="mt-2 text-[13px] leading-relaxed text-[#6b6256]">{instrument} · {section}</p><p className="mt-1 text-[11px] text-[#766a5c]">Slovenská filharmónia</p></div>
      </div>
    </section>

    <Group title="Osobné údaje">
      <Row icon={<Mail/>} label="E-mail" value={user.email}/>
      <Row icon={<Phone/>} label="Telefón" value={phone}/>
      <Row icon={<MapPin/>} label="Mesto" value="Bratislava"/>
    </Group>

    <Group title="Orchester">
      <Row icon={<Music2/>} label="Sekcia" value={section}/>
      <Row icon={<CalendarDays/>} label="Člen od" value="Január 2024"/>
    </Group>

    <Group title="Nastavenia">
      <Row icon={<Bell/>} label="Notifikácie" value="Zapnuté" chevron/>
      <Row icon={<Globe2/>} label="Jazyk" value={lang==="sk"?"Slovenčina":lang==="de"?"Deutsch":"English"} chevron/>
    </Group>

    <p className="px-2 pb-2 text-center text-[11px] text-[#766e64]">Worktime · Slovenská filharmónia</p>
  </div>
}

function Group({title,children}:{title:string;children:React.ReactNode}) {
  return <section><h2 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[.1em] text-[#766a5c]">{title}</h2><div className="overflow-hidden rounded-[18px] border border-[#8b6f4b]/15 bg-white shadow-[0_2px_8px_rgba(62,48,30,0.025)]">{children}</div></section>
}

function Row({icon,label,value,chevron=false}:{icon:React.ReactNode;label:string;value:string;chevron?:boolean}) {
  return <div className="flex items-center gap-3 border-b border-[#8b6f4b]/10 px-4 py-3.5 last:border-0 max-[360px]:flex-wrap">
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f3eee7] text-[#806442] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:stroke-[1.75]">{icon}</span>
    <span className="flex-1 text-[13px] font-medium">{label}</span>
    <span className="min-w-0 max-w-[52%] text-right text-[12px] leading-relaxed text-[#6b6256] [overflow-wrap:anywhere] max-[360px]:order-last max-[360px]:ml-11 max-[360px]:max-w-none max-[360px]:basis-full max-[360px]:text-left">{value}</span>
    {chevron&&<ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8b7a63]"/>}
  </div>
}
