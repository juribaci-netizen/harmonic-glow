"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { autoFillMonthFromWorkPlan, confirmSuggestedEntry, deleteEntry } from "@/app/actions/time-entries"
import { ChevronLeft, ChevronRight, FileText } from "lucide-react"

type Entry={id:number;date:string;type:string;title:string;hours:string;status:string;notes:string|null}

export function TimesheetView({initialEntries,year:initialYear,month:initialMonth}:{initialEntries:Entry[];year:number;month:number}){
  const {t,lang}=useI18n()
  const [cursor,setCursor]=useState(new Date(initialYear,initialMonth,1))
  const [entries,setEntries]=useState(initialEntries)
  const [signing,setSigning]=useState(false)
  const [signed,setSigned]=useState(false)
  const [hasInk,setHasInk]=useState(false)
  const canvasRef=useRef<HTMLCanvasElement|null>(null)
  const drawingRef=useRef(false)
  const locale=lang==="sk"?"sk-SK":lang==="de"?"de-DE":"en-GB"

  const load=async(y:number,m:number)=>{
    await autoFillMonthFromWorkPlan(y,m)
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
  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const canvas=canvasRef.current!
    const r=canvas.getBoundingClientRect()
    return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}
  }
  const beginSign=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const canvas=canvasRef.current!
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current=true
    const p=point(e),ctx=canvas.getContext("2d")!
    ctx.beginPath();ctx.moveTo(p.x,p.y)
  }
  const drawSign=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    if(!drawingRef.current)return
    const p=point(e),ctx=canvasRef.current!.getContext("2d")!
    ctx.lineWidth=2.2;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#111"
    ctx.lineTo(p.x,p.y);ctx.stroke();setHasInk(true)
  }
  const endSign=()=>{drawingRef.current=false}
  const clearSign=()=>{
    const canvas=canvasRef.current
    if(canvas)canvas.getContext("2d")!.clearRect(0,0,canvas.width,canvas.height)
    setHasInk(false)
  }
  const confirmSign=()=>{
    if(!hasInk)return
    setSigned(true);setSigning(false)
  }

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
    <header className="pt-1">
      <p className="modern-kicker text-black/35">Evidencia pracovného času</p>
      <h1 className="ios-title mt-1">EPČ</h1>
    </header>

    <section className="apple-card overflow-hidden rounded-[24px]">
      <div className="grid grid-cols-[44px_1fr_44px] items-center border-b border-black/[.05] px-3 py-3">
        <button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[.035]"><ChevronLeft className="h-4 w-4"/></button>
        <div className="text-center">
          <p className="text-[16px] font-semibold capitalize tracking-[-.02em]">{monthName}</p>
          <p className="mt-0.5 text-[10px] text-black/35">Mesačná evidencia</p>
        </div>
        <button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[.035]"><ChevronRight className="h-4 w-4"/></button>
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.08em] text-black/32">Stav</p>
          <p className="mt-1 text-[14px] font-semibold">{suggestions.length ? "Vyžaduje kontrolu" : "Pripravené na kontrolu"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-black/32">Evidované</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-.03em]">{total.toFixed(1)} h</p>
        </div>
      </div>
    </section>

    {suggestions.length>0&&<section>
      <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[.08em] text-black/32">Na kontrolu</p>
      <div className="apple-card overflow-hidden rounded-[22px]">
        {suggestions.map(e=><div key={e.id} className="flex items-center gap-3 border-b border-black/[.05] px-4 py-3.5 last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold">{new Date(e.date+"T00:00:00").toLocaleDateString(locale,{weekday:"short",day:"numeric",month:"short"})}</p>
            <p className="mt-0.5 text-[10px] text-black/38">IP · {Number(e.hours).toFixed(1)} h</p>
          </div>
          <button onClick={()=>confirm(e.id)} className="rounded-full bg-black px-3 py-1.5 text-[10px] font-semibold text-white">Potvrdiť</button>
          <button onClick={()=>remove(e.id)} className="text-[10px] font-medium text-black/32">Upraviť</button>
        </div>)}
      </div>
    </section>}

    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold tracking-[-.02em]">Prehľad dní</h2>
        <span className="text-[10px] text-black/30">Plán práce + IP</span>
      </div>
      <div className="apple-card overflow-hidden rounded-[24px]">
        {grouped.length===0?<p className="p-7 text-center text-[12px] text-black/35">Zatiaľ žiadna evidencia.</p>:grouped.map(([date,dayEntries])=>{
          const confirmedDay=dayEntries.filter(e=>e.status!=="suggested")
          const dayTotal=confirmedDay.reduce((s,e)=>s+Number(e.hours),0)
          const ip=dayEntries.filter(e=>e.type==="ip").reduce((s,e)=>s+Number(e.hours),0)
          const work=dayEntries.filter(e=>e.type!=="ip"&&e.status!=="suggested")
          return <div key={date} className="border-b border-black/[.055] px-4 py-3.5 last:border-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold capitalize">{new Date(date+"T00:00:00").toLocaleDateString(locale,{weekday:"short",day:"numeric",month:"short"})}</p>
                <p className="mt-1 truncate text-[11px] text-black/48">{work.length?work.map(e=>e.title).join(" · "):"Individuálna príprava"}</p>
              </div>
              <p className="shrink-0 text-[15px] font-semibold">{dayTotal.toFixed(1)} h</p>
            </div>
            <div className="mt-2 flex gap-3 text-[9px] text-black/32">
              {work.length>0&&<span>Služba {work.reduce((s,e)=>s+Number(e.hours),0).toFixed(1)} h</span>}
              {ip>0&&<span>IP {ip.toFixed(1)} h</span>}
            </div>
          </div>
        })}
      </div>
    </section>

    <section className="apple-card rounded-[24px] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-black/[.04]"><FileText className="h-4 w-4"/></span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold">Mesačný výkaz EPČ</p>
          <p className="mt-0.5 text-[10px] text-black/35">Oficiálny formulár · automaticky vyplnený</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button className="rounded-[13px] bg-black/[.045] px-2 py-3 text-[10px] font-semibold">Skontrolovať</button>
        <button className="rounded-[13px] bg-black/[.045] px-2 py-3 text-[10px] font-semibold">Upraviť</button>
        <button onClick={()=>setSigning(true)} className="rounded-[13px] bg-black px-2 py-3 text-[10px] font-semibold text-white">{signed?"Podpísané ✓":"Podpísať EPČ"}</button>
      </div>
      {signed&&<p className="mt-3 text-center text-[10px] font-medium text-black/42">Podpis potvrdený · pripravené na vytvorenie PDF</p>}
    </section>

    <button onClick={exportCsv} className="w-full py-2 text-center text-[10px] font-medium text-black/28">Exportovať dáta CSV</button>

    {signing&&<div className="fixed inset-0 z-[100] flex items-end bg-black/20 backdrop-blur-[2px]">
      <div className="w-full rounded-t-[30px] bg-white px-5 pb-[calc(22px+env(safe-area-inset-bottom))] pt-4 shadow-2xl">
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-black/12"/>
        <div className="mx-auto max-w-md">
          <p className="text-[10px] font-medium uppercase tracking-[.09em] text-black/30">EPČ · ${monthName}</p>
          <h3 className="mt-1 text-[23px] font-semibold tracking-[-.035em]">Podpíšte výkaz</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-black/42">Podpíšte sa prstom alebo stylusom. Podpis sa použije iba pre tento mesačný výkaz.</p>
          <div className="mt-5 overflow-hidden rounded-[20px] border border-black/[.07] bg-[#fbfbfa]">
            <canvas ref={canvasRef} width={720} height={260} onPointerDown={beginSign} onPointerMove={drawSign} onPointerUp={endSign} onPointerCancel={endSign} className="block h-[170px] w-full touch-none"/>
            <div className="mx-5 border-t border-black/10 pb-3 pt-2 text-center text-[9px] text-black/25">podpis zamestnanca</div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={clearSign} className="px-2 py-2 text-[11px] font-medium text-black/38">Vymazať</button>
            <button onClick={()=>setSigning(false)} className="px-2 py-2 text-[11px] font-medium text-black/38">Zrušiť</button>
          </div>
          <button disabled={!hasInk} onClick={confirmSign} className="mt-2 w-full rounded-[16px] bg-black px-4 py-4 text-[12px] font-semibold text-white disabled:opacity-20">Potvrdiť podpis</button>
        </div>
      </div>
    </div>}
  </div>
}
