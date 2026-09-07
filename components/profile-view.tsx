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

  return <div className="space-y-5">
    <header className="pt-1"><h1 className="ios-title">Profil</h1></header>

    <section className="apple-card rounded-[28px] p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0a84ff] to-[#65b7ff] text-white shadow-lg"><Music2 className="h-8 w-8"/></div>
        <div><h2 className="text-[20px] font-bold tracking-[-.02em]">{fullName}</h2><p className="mt-1 text-[13px] text-black/45">{instrument} · {section}</p><p className="mt-1 text-[11px] text-black/35">Slovenská filharmónia</p></div>
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

    <p className="px-2 pb-2 text-center text-[10px] text-black/28">Worktime · Slovenská filharmónia</p>
  </div>
}

function Group({title,children}:{title:string;children:React.ReactNode}) {
  return <section><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.08em] text-black/34">{title}</p><div className="apple-card overflow-hidden rounded-[24px]">{children}</div></section>
}

function Row({icon,label,value,chevron=false}:{icon:React.ReactNode;label:string;value:string;chevron?:boolean}) {
  return <div className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
    <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#0a84ff] text-white [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
    <span className="flex-1 text-[13px] font-medium">{label}</span>
    <span className="max-w-[48%] truncate text-[12px] text-black/42">{value}</span>
    {chevron&&<ChevronRight className="h-4 w-4 text-black/20"/>}
  </div>
}
