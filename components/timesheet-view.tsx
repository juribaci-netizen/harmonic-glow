"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { confirmSuggestedEntry, deleteEntry, suggestIndividualPreparation } from "@/app/actions/time-entries"
import { ChevronLeft, ChevronRight, Download, Sparkles, CheckCircle2, Clock3, FileText } from "lucide-react"

type Entry={id:number;date:string;type:string;title:string;hours:string;status:string;notes:string|null}

export function TimesheetView({initialEntries,year:initialYear,month:initialMonth}:{initialEntries:Entry[];year:number;month:number}){
  const {t,lang}=useI18n()
  const [cursor,setCursor]=useState(new Date(initialYear,initialMonth,1))
  const [entries,setEntries]=useState(initialEntries)
  const locale=lang==="sk"?"sk-SK":lang==="de"?"de-DE":"en-GB"

  const load=async(y:number,m:number)=>{
    await suggestIndividualPreparation(y,m)
    const res=await fetch("/api/timesheet?year="+y+"&month="+m)
    if(res.ok)setEntries(await res.json())
  }

  useEffect(()=>{load(cursor.getFullYear(),cursor.getMonth())},[cursor])

  const monthName=cursor.toLocaleDateString(locale,{month:"long",year:"numeric"})
  const confirmed=useMemo(()=>entries.filter(e=>e.status!=="suggested"),[entries])
  const suggestions=useMemo(()=>entries.filter(e=>e.status==="suggested"),[entries])
  const total=useMemo(()=>confirmed.reduce((s,e)=>s+Number(e.hours),0),[confirmed])
  const weeks=useMemo(()=>{
    const map=new Map<string,number>()
    confirmed.forEach(e=>{
      const d=new Date(e.date+"T00:00:00")
      const day=(d.getDay()+6)%7
      d.setDate(d.getDate()-day)
      const key=d.toISOString().slice(0,10)
      map.set(key,(map.get(key)??0)+Number(e.hours))
    })
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]))
  },[confirmed])

  const grouped=Array.from(entries.reduce((m,e)=>{
    const a=m.get(e.date)||[]
    a.push(e)
    m.set(e.date,a)
    return m
  },new Map<string,Entry[]>()).entries()).sort((a,b)=>a[0].localeCompare(b[0]))

  const confirm=async(id:number)=>{await confirmSuggestedEntry(id);await load(cursor.getFullYear(),cursor.getMonth())}
  const remove=async(id:number)=>{await deleteEntry(id);setEntries(x=>x.filter(e=>e.id!==id))}
  const exportCsv=()=>{
    const head=["Dátum","Činnosť","Hodiny","Stav"]
    const rows=entries.map(e=>[e.date,e.title,e.hours,e.status].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(','))
    const blob=new Blob([[head.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download="epc-"+cursor.getFullYear()+"-"+(cursor.getMonth()+1)+".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return <div className="space-y-5">
    <header className="pt-1"><p className="modern-kicker text-black/35">Evidencia pracovného času</p><h1 className="ios-title mt-1">EPČ</h1></header>

    <section className="apple-card rounded-[20px] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-black/35">Formulár EPČ</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-bold tracking-[-.02em]">Oficiálny formulár</p>
          <p className="mt-1 text-[10px] leading-4 text-black/40">EPČ version 2.1 · pôvodný PDF formulár</p>
        </div>
        <button onClick={()=>document.getElementById("epc-formular")?.scrollIntoView({behavior:"smooth",block:"center"})} className="shrink-0 rounded-full bg-black px-4 py-2 text-[11px] font-semibold text-white">Zobraziť</button>
      </div>
      <div id="epc-formular" className="mt-3 rounded-[14px] bg-[#f4f4f5] p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white shadow-sm"><FileText className="h-4 w-4"/></span>
          <div>
            <p className="text-[12px] font-semibold">Mesačný výkaz EPČ</p>
            <p className="mt-0.5 text-[10px] text-black/40">Automaticky vyplnený podľa evidencie</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="rounded-[12px] bg-white px-3 py-2.5 text-[11px] font-semibold shadow-sm">Náhľad formulára</button>
          <button className="rounded-[12px] bg-black px-3 py-2.5 text-[11px] font-semibold text-white">Vytvoriť PDF</button>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
      <button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))} className="apple-card flex h-11 w-11 items-center justify-center rounded-full"><ChevronLeft className="h-5 w-5"/></button>
      <div className="apple-card rounded-[18px] px-4 py-3 text-center"><p className="text-[14px] font-bold capitalize">{monthName}</p></div>
      <button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))} className="apple-card flex h-11 w-11 items-center justify-center rounded-full"><ChevronRight className="h-5 w-5"/></button>
    </div>

    <section className="grid grid-cols-2 gap-3">
      <div className="rounded-[24px] bg-black p-4 text-white shadow-lg">
        <p className="text-[10px] font-semibold text-white/45">Pracovný fond</p>
        <p className="mt-2 text-[28px] font-bold">40 h</p>
        <p className="mt-1 text-[10px] text-white/40">za týždeň</p>
      </div>
      <div className="rounded-[24px] bg-[#1f49ff] p-4 text-white shadow-[0_12px_28px_rgba(10,132,255,.25)]">
        <p className="text-[10px] font-semibold text-white/65">Potvrdené</p>
        <p className="mt-2 text-[28px] font-bold">{total.toFixed(1)} h</p>
        <p className="mt-1 text-[10px] text-white/55">v období</p>
      </div>
    </section>

    {suggestions.length>0&&<section>
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.08em] text-black/34">Návrhy prípravy</p>
      <div className="apple-card overflow-hidden rounded-[24px]">
        {suggestions.map(e=><div key={e.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3cd] text-[#a66b00]"><Sparkles className="h-4 w-4"/></span>
          <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{new Date(e.date+"T00:00:00").toLocaleDateString(locale,{day:"numeric",month:"short"})}</p><p className="text-[10px] text-black/38">{Number(e.hours).toFixed(1)} h · individuálna príprava</p></div>
          <button onClick={()=>confirm(e.id)} className="rounded-full bg-[#1f49ff] px-3 py-1.5 text-[11px] font-bold text-white">OK</button>
          <button onClick={()=>remove(e.id)} className="text-[11px] font-semibold text-black/35">Nie</button>
        </div>)}
      </div>
    </section>}

    <section>
      <div className="mb-2 flex items-center justify-between px-1"><h2 className="ios-section-title">Týždne</h2></div>
      <div className="apple-card overflow-hidden rounded-[24px]">
        {weeks.length===0?<p className="p-6 text-center text-[13px] text-black/40">Zatiaľ žiadna evidencia.</p>:weeks.map(([start,hours])=>{
          const pct=Math.min(100,hours/40*100)
          return <div key={start} className="border-b border-black/[.05] px-4 py-3.5 last:border-0">
            <div className="flex items-center justify-between"><p className="text-[12px] font-semibold">{new Date(start+"T00:00:00").toLocaleDateString(locale,{day:"numeric",month:"short"})}</p><p className="text-[12px] font-bold">{hours.toFixed(1)} / 40 h</p></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[.08]"><div className="h-full rounded-full bg-[#1f49ff]" style={{width:String(pct)+"%"}}/></div>
            {hours>=40&&<p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#34c759]"><CheckCircle2 className="h-3 w-3"/>Splnené</p>}
          </div>
        })}
      </div>
    </section>

    <section>
      <div className="mb-2 flex items-center justify-between px-1"><h2 className="ios-section-title">Záznamy</h2><span className="text-[10px] font-semibold text-[#34c759]">Automaticky</span></div>
      <div className="space-y-3">
        {grouped.length===0?<div className="apple-card rounded-[24px] p-7 text-center text-[13px] text-black/40">{t.noRecords}</div>:grouped.map(([date,dayEntries])=><div key={date} className="apple-card overflow-hidden rounded-[24px]">
          <div className="flex items-center justify-between border-b border-black/[.05] bg-black/[.015] px-4 py-3"><p className="text-[12px] font-bold capitalize">{new Date(date+"T00:00:00").toLocaleDateString(locale,{weekday:"short",day:"numeric",month:"short"})}</p><p className="text-[11px] font-bold">{dayEntries.filter(e=>e.status!=="suggested").reduce((s,e)=>s+Number(e.hours),0).toFixed(1)} h</p></div>
          {dayEntries.map(e=><div key={e.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#ece8df] text-[#1f49ff]"><Clock3 className="h-4 w-4"/></span>
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{e.title}</p><p className="text-[10px] text-black/38">{e.status==="suggested"?"Návrh":e.type==="rehearsal"||e.type==="concert"?"Kolektívny výkon":"Individuálna príprava"}</p></div>
            <span className="text-[12px] font-bold">{Number(e.hours).toFixed(1)} h</span>
          </div>)}
        </div>)}
      </div>
    </section>

    <button onClick={exportCsv} className="apple-card flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 text-[13px] font-bold text-[#1f49ff]"><Download className="h-4 w-4"/>Exportovať EPČ</button>
  </div>
}
