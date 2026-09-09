"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { autoFillMonthFromWorkPlan, updateTimeEntryHours } from "@/app/actions/time-entries"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Entry={id:number;date:string;type:string;title:string;hours:string;status:string;notes:string|null;startTime?:string|null;endTime?:string|null}

export function TimesheetView({initialEntries,year:initialYear,month:initialMonth}:{initialEntries:Entry[];year:number;month:number}){
  const {t,lang}=useI18n()
  const [cursor,setCursor]=useState(new Date(initialYear,initialMonth,1))
  const [entries,setEntries]=useState(initialEntries)
  const [signing,setSigning]=useState(false)
  const [signed,setSigned]=useState(false)
  const [editing,setEditing]=useState(false)
  const [draftHours,setDraftHours]=useState<Record<number,string>>({})
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
  const total=useMemo(()=>confirmed.reduce((s,e)=>s+Number(e.hours),0),[confirmed])
  const grouped=useMemo(()=>Array.from(confirmed.reduce((m,e)=>{
    const a=m.get(e.date)||[]
    a.push(e)
    m.set(e.date,a)
    return m
  },new Map<string,Entry[]>()).entries()).sort((a,b)=>a[0].localeCompare(b[0])),[confirmed])

  const beginEdit=()=>{
    const next:Record<number,string>={}
    confirmed.forEach(e=>next[e.id]=String(Number(e.hours)))
    setDraftHours(next)
    setEditing(true)
  }

  const saveEdit=async()=>{
    for(const e of confirmed){
      const raw=draftHours[e.id]
      if(raw==null) continue
      const next=Number(raw)
      if(Number.isFinite(next) && next!==Number(e.hours)) await updateTimeEntryHours(e.id,next)
    }
    setEditing(false)
    await load(cursor.getFullYear(),cursor.getMonth())
  }

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

  const today=new Date()
  const ipLabel=(hours:number,hasWork:boolean)=>{
    const minutes=Math.max(30,Math.round(hours*60))
    const start=hasWork?17*60:10*60
    const end=start+minutes
    const hh=(n:number)=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")
    return hh(start)+"–"+hh(end)
  }

  const visibleDays=grouped.filter(([date])=>{
    const d=new Date(date+"T23:59:59")
    return cursor.getFullYear()<today.getFullYear() || (cursor.getFullYear()===today.getFullYear() && cursor.getMonth()<today.getMonth()) || d<=today
  })

  return <div className="space-y-5">
    <header className="pt-1">
      <p className="modern-kicker text-black/35">Evidencia pracovného času</p>
      <h1 className="ios-title mt-1">EPČ</h1>
    </header>

    <section className="overflow-hidden rounded-[26px] border border-black/[.05] bg-white shadow-[0_16px_44px_rgba(0,0,0,.045)]">
      <div className="grid grid-cols-[42px_1fr_42px] items-center border-b border-black/[.05] px-4 py-4">
        <button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[.035]"><ChevronLeft className="h-4 w-4"/></button>
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-[.1em] text-black/28">Mesačný výkaz EPČ</p>
          <p className="mt-1 text-[18px] font-semibold capitalize tracking-[-.03em]">{monthName}</p>
        </div>
        <button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[.035]"><ChevronRight className="h-4 w-4"/></button>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold">Náhľad PDF</p>
            <p className="mt-0.5 text-[10px] text-black/35">Originálny formulár EPČ 2.1 · živý náhľad</p>
          </div>
          <button onClick={beginEdit} className="rounded-full bg-black/[.045] px-3 py-2 text-[10px] font-semibold">Upraviť</button>
        </div>

        <div className="w-full bg-white">
          <iframe
            key={cursor.getFullYear()+"-"+cursor.getMonth()+"-"+entries.map(e=>e.id+":"+e.hours+":"+e.status).join("|")}
            src={"/api/epc-pdf?year="+cursor.getFullYear()+"&month="+cursor.getMonth()+"&v="+Date.now()+"#toolbar=0&navpanes=0&view=FitH"}
            title={"EPČ "+monthName}
            className="block h-[72vh] min-h-[620px] w-full border-0 bg-white"
          />
        </div>

        <p className="mt-3 text-center text-[9px] leading-relaxed text-black/35">Budúce dni zostávajú prázdne. Po skončení dňa sa služby a doplnená IP automaticky objavia v náhľade.</p>

        {editing&&<div className="mt-4 rounded-[18px] bg-black/[.025] p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold">Upraviť hodiny</p><button onClick={saveEdit} className="rounded-full bg-black px-3 py-1.5 text-[9px] font-semibold text-white">Uložiť</button></div>
          <div className="max-h-48 space-y-2 overflow-auto">
            {visibleDays.flatMap(([,es])=>es).map(e=><div key={e.id} className="flex items-center justify-between gap-3 text-[9px]"><span className="min-w-0 truncate text-black/50">{e.date} · {e.title}</span><input inputMode="decimal" value={draftHours[e.id]??String(Number(e.hours))} onChange={ev=>setDraftHours(x=>({...x,[e.id]:ev.target.value}))} className="w-16 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-right outline-none"/></div>)}
          </div>
        </div>}

        <button onClick={()=>setSigning(true)} className="mt-4 w-full rounded-[15px] bg-black px-4 py-3.5 text-[11px] font-semibold text-white">{signed?"Podpísané ✓":"Podpísať EPČ"}</button>
      </div>
    </section>

    {signing&&<div className="fixed inset-0 z-[100] flex items-end bg-black/20 backdrop-blur-[2px]">
      <div className="w-full rounded-t-[30px] bg-white px-5 pb-[calc(22px+env(safe-area-inset-bottom))] pt-4 shadow-2xl">
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-black/12"/>
        <div className="mx-auto max-w-md">
          <p className="text-[10px] font-medium uppercase tracking-[.09em] text-black/30">EPČ · {monthName}</p>
          <h3 className="mt-1 text-[23px] font-semibold tracking-[-.035em]">Podpíšte výkaz</h3>
          <p className="mt-1 text-[11px] text-black/42">Podpíšte sa prstom alebo stylusom. Podpis sa použije iba pre tento mesačný výkaz.</p>
          <div className="mt-5 overflow-hidden rounded-[20px] border border-black/[.07] bg-[#fbfbfa]">
            <canvas ref={canvasRef} width={720} height={260} onPointerDown={beginSign} onPointerMove={drawSign} onPointerUp={endSign} onPointerCancel={endSign} className="block h-[170px] w-full touch-none"/>
            <div className="mx-5 border-t border-black/10 pb-3 pt-2 text-center text-[9px] text-black/25">podpis zamestnanca</div>
          </div>
          <div className="mt-3 flex justify-between"><button onClick={clearSign} className="px-2 py-2 text-[11px] text-black/38">Vymazať</button><button onClick={()=>setSigning(false)} className="px-2 py-2 text-[11px] text-black/38">Zrušiť</button></div>
          <button disabled={!hasInk} onClick={confirmSign} className="mt-2 w-full rounded-[16px] bg-black px-4 py-4 text-[12px] font-semibold text-white disabled:opacity-20">Potvrdiť podpis</button>
        </div>
      </div>
    </div>}
  </div>
}
