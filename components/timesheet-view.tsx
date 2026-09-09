"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useI18n } from "@/components/language-provider"
import { autoFillMonthFromWorkPlan, updateTimeEntryHours, setManualService, setManualIpTime } from "@/app/actions/time-entries"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Entry={id:number;date:string;type:string;title:string;hours:string;status:string;notes:string|null;startTime?:string|null;endTime?:string|null}

export function TimesheetView({initialEntries,year:initialYear,month:initialMonth}:{initialEntries:Entry[];year:number;month:number}){
  const {t,lang}=useI18n()
  const [cursor,setCursor]=useState(new Date(initialYear,initialMonth,1))
  const [entries,setEntries]=useState(initialEntries)
  const [signing,setSigning]=useState(false)
  const [signed,setSigned]=useState(false)
  const [signatureData,setSignatureData]=useState<string|null>(null)
  const [editing,setEditing]=useState(false)
  const [pdfEditing,setPdfEditing]=useState(false)
  const [draftHours,setDraftHours]=useState<Record<number,string>>({})
  const [serviceSlots,setServiceSlots]=useState<[boolean,boolean]>([false,false])
  const [ipSlots,setIpSlots]=useState<[string,string,string,string]>(["","","",""])
  const [hasInk,setHasInk]=useState(false)
  const [selectedDate,setSelectedDate]=useState<string|null>(null)
  const canvasRef=useRef<HTMLCanvasElement|null>(null)
  const drawingRef=useRef(false)
  const locale=lang==="sk"?"sk-SK":lang==="de"?"de-DE":"en-GB"

  const load=async(y:number,m:number)=>{
    await autoFillMonthFromWorkPlan(y,m)
    const res=await fetch("/api/timesheet?year="+y+"&month="+m)
    if(res.ok)setEntries(await res.json())
    try{
      const saved=window.localStorage.getItem("epc-signature:"+y+"-"+m)
      setSignatureData(saved)
      setSigned(!!saved)
    }catch{
      setSignatureData(null)
      setSigned(false)
    }
  }

  useEffect(()=>{load(cursor.getFullYear(),cursor.getMonth())},[cursor])

  const monthName=cursor.toLocaleDateString(locale,{month:"long",year:"numeric"})
  const epcMonths=["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"]
  const epcMonthName=epcMonths[cursor.getMonth()]
  const confirmed=useMemo(()=>entries.filter(e=>e.status!=="suggested"&&e.status!=="removed"),[entries])
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
    const canvas=canvasRef.current
    if(!canvas)return
    const data=canvas.toDataURL("image/png")
    try{window.localStorage.setItem("epc-signature:"+cursor.getFullYear()+"-"+cursor.getMonth(),data)}catch{}
    setSignatureData(data)
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

  const selectedEntries=useMemo(()=>selectedDate?entries.filter(e=>e.date===selectedDate&&e.status!=="suggested"):[],[selectedDate,entries])

  const openDay=(date:string)=>{
    const dayEntries=entries.filter(e=>e.date===date&&e.status!=="suggested")
    const work=dayEntries.filter(e=>e.type!=="individual"&&e.type!=="ip").sort((a,b)=>String(a.startTime??"").localeCompare(String(b.startTime??"")))
    const ips=dayEntries.filter(e=>e.type==="individual"||e.type==="ip").sort((a,b)=>String(a.startTime??"").localeCompare(String(b.startTime??"")))
    setServiceSlots([
      !!work[0]&&work[0].status!=="removed",
      !!work[1]&&work[1].status!=="removed",
    ])
    setIpSlots([
      ips[0]?.status==="removed"?"":(ips[0]?.startTime??""),
      ips[0]?.status==="removed"?"":(ips[0]?.endTime??""),
      ips[1]?.status==="removed"?"":(ips[1]?.startTime??""),
      ips[1]?.status==="removed"?"":(ips[1]?.endTime??""),
    ])
    setSelectedDate(date)
  }

  const saveSelectedDay=async()=>{
    if(!selectedDate)return
    await setManualService(selectedDate,1,serviceSlots[0])
    await setManualService(selectedDate,2,serviceSlots[1])
    await setManualIpTime(selectedDate,1,ipSlots[0]||null,ipSlots[1]||null)
    await setManualIpTime(selectedDate,2,ipSlots[2]||null,ipSlots[3]||null)
    await load(cursor.getFullYear(),cursor.getMonth())
    setSelectedDate(null)
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
          {(()=>{
            const pdfUrl="/api/epc-pdf?year="+cursor.getFullYear()+"&month="+cursor.getMonth()
            return <>
              <div className={"relative mx-auto aspect-[595.32/841.92] w-full overflow-hidden bg-white "+(pdfEditing?"ring-2 ring-black/10":"")}>
                <img
                  src="https://d2jqrm6oza8nb6.cloudfront.net/datasets/2306003c-8cd1-4fa1-a5bf-9e35edfa0575.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYzdkNzdjN2IxODQ0M2M3ZCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc4OTEyMDg5MX0.PR1OWzZLJoTYf5nRDNickMH8UvccEbDQEcuq7s78Wic"
                  alt="Originálny formulár EPČ 2.1"
                  className="absolute inset-0 h-full w-full object-fill"
                />

                {/* Header fields — exact rectangles from the original AcroForm */}
                <div className="pointer-events-none absolute inset-0 text-black">
                  <span className="absolute left-[17.15%] top-[5.64%] -translate-y-full text-[clamp(6px,1.05vw,12px)] font-medium leading-none">{epcMonthName}</span>
                  <span className="absolute left-[35.75%] top-[5.64%] -translate-y-full text-[clamp(6px,1.05vw,12px)] font-medium leading-none">{cursor.getFullYear()}</span>
                  <span className="absolute left-[19.45%] top-[8.02%] -translate-y-full text-[clamp(7px,1.15vw,13px)] font-medium leading-none">Marek Juráň</span>
                  <span className="absolute left-[58.759%] top-[8.527%] h-[2.096%] w-[9.221%] rounded-[1px] border border-black/65" />
                  <span aria-hidden className="absolute left-[41.3%] top-[6.55%] h-[1.9%] w-[8.5%] bg-white" />
                  <span aria-hidden className="absolute left-[41.65%] top-[7.20%] text-[clamp(5px,.85vw,9px)] font-normal">Orchester</span>
                  {/* EPČ plain ensemble label */}
                  {signed&&signatureData&&<img
                    src={signatureData}
                    alt="Podpis zamestnanca"
                    className="absolute left-[57.3%] top-[89.2%] h-[3.1%] w-[29%] object-contain object-left"
                  />}
                </div>

                {/* Exact original form controls */}
                {Array.from({length:new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()},(_,i)=>i+1).map(day=>{
                  const date=cursor.getFullYear()+"-"+String(cursor.getMonth()+1).padStart(2,"0")+"-"+String(day).padStart(2,"0")
                  const isPast=cursor.getFullYear()<today.getFullYear() || (cursor.getFullYear()===today.getFullYear()&&cursor.getMonth()<today.getMonth()) || new Date(date+"T23:59:59")<=today
                  const dayEntries=entries.filter(e=>e.date===date&&e.status!=="suggested")
                  const work=dayEntries.filter(e=>e.type!=="individual"&&e.type!=="ip").sort((a,b)=>String(a.startTime??"").localeCompare(String(b.startTime??"")))
                  const ips=dayEntries.filter(e=>e.type==="individual"||e.type==="ip").sort((a,b)=>String(a.startTime??"").localeCompare(String(b.startTime??"")))
                  const rowTop=17.186+(day-1)*2.0829
                  const cb1=!!work[0]&&work[0].status!=="removed"
                  const cb2=!!work[1]&&work[1].status!=="removed"
                  const ip1=ips[0]&&ips[0].status!=="removed"&&ips[0].startTime&&ips[0].endTime ? ips[0].startTime+"-"+ips[0].endTime : ""
                  const ip2=ips[1]&&ips[1].status!=="removed"&&ips[1].startTime&&ips[1].endTime ? ips[1].startTime+"-"+ips[1].endTime : ""
                  const morningOpts=["","04:00-08:00","06:00-10:00","08:00-12:00","10:00-14:00"]
                  const afternoonOpts=["","12:00-16:00","14:00-18:00","16:00-20:00","18:00-22:00","20:00-24:00"]
                  const saveRange=async(slot:1|2,value:string)=>{
                    const parts=value?value.split("-"):["",""]
                    await setManualIpTime(date,slot,parts[0]||null,parts[1]||null)
                    await load(cursor.getFullYear(),cursor.getMonth())
                  }
                  return <div key={date}>
                    <button
                      disabled={!pdfEditing||!isPast}
                      onClick={async()=>{await setManualService(date,1,!cb1);await load(cursor.getFullYear(),cursor.getMonth())}}
                      className={"absolute flex items-center justify-center disabled:pointer-events-none "+(pdfEditing?"hover:bg-black/[.04]":"")}
                      style={{left:"16.960%",top:rowTop+"%",width:"7.648%",height:"1.987%"}}
                      aria-label={date+" 1. služba"}
                    >
                      {cb1&&<span className="text-[clamp(7px,1.35vw,12px)] font-bold leading-none">X</span>}
                    </button>
                    <button
                      disabled={!pdfEditing||!isPast}
                      onClick={async()=>{await setManualService(date,2,!cb2);await load(cursor.getFullYear(),cursor.getMonth())}}
                      className={"absolute flex items-center justify-center disabled:pointer-events-none "+(pdfEditing?"hover:bg-black/[.04]":"")}
                      style={{left:"24.760%",top:(rowTop+.026)+"%",width:"7.641%",height:"1.970%"}}
                      aria-label={date+" 2. služba"}
                    >
                      {cb2&&<span className="text-[clamp(7px,1.35vw,12px)] font-bold leading-none">X</span>}
                    </button>

                    {pdfEditing?<select
                      disabled={!isPast}
                      value={ip1}
                      onChange={e=>saveRange(1,e.target.value)}
                      className="absolute appearance-none border-0 bg-transparent px-[2px] text-[clamp(4px,.85vw,8px)] outline-none"
                      style={{left:"38.394%",top:(rowTop-.017)+"%",width:"20.524%",height:"2.004%"}}
                      aria-label={date+" individuálna príprava 1"}
                    >
                      {morningOpts.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>:ip1&&<span
                      className="pointer-events-none absolute flex items-center px-[2px] text-[clamp(4px,.85vw,8px)]"
                      style={{left:"38.394%",top:(rowTop-.017)+"%",width:"20.524%",height:"2.004%"}}
                    >{ip1}</span>}

                    {pdfEditing?<select
                      disabled={!isPast}
                      value={ip2}
                      onChange={e=>saveRange(2,e.target.value)}
                      className="absolute appearance-none border-0 bg-transparent px-[2px] text-[clamp(4px,.85vw,8px)] outline-none"
                      style={{left:"64.867%",top:(rowTop+.052)+"%",width:"20.047%",height:"1.918%"}}
                      aria-label={date+" individuálna príprava 2"}
                    >
                      {afternoonOpts.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>:ip2&&<span
                      className="pointer-events-none absolute flex items-center px-[2px] text-[clamp(4px,.85vw,8px)]"
                      style={{left:"64.867%",top:(rowTop+.052)+"%",width:"20.047%",height:"1.918%"}}
                    >{ip2}</span>}
                  </div>
                })}
              </div>
              <button onClick={()=>setPdfEditing(v=>!v)} className="mt-3 block w-full rounded-[13px] bg-black/[.06] px-3 py-3 text-center text-[10px] font-semibold">
                {pdfEditing?"Hotovo":"Upraviť originálne polia"}
              </button>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="mt-3 block w-full rounded-[13px] bg-black px-3 py-3 text-center text-[10px] font-semibold text-white">
                Otvoriť živé PDF
              </a>
            </>
          })()}
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

    {selectedDate&&<div className="fixed inset-0 z-[95] flex items-end bg-black/20 backdrop-blur-[2px]">
      <div className="w-full rounded-t-[30px] bg-white px-5 pb-[calc(22px+env(safe-area-inset-bottom))] pt-4 shadow-2xl">
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-black/12"/>
        <div className="mx-auto max-w-md">
          <p className="text-[10px] font-medium uppercase tracking-[.09em] text-black/30">EPČ · {selectedDate}</p>
          <h3 className="mt-1 text-[23px] font-semibold tracking-[-.035em]">Upraviť priamo v EPČ</h3>
          <p className="mt-1 text-[11px] text-black/42">Ťuknutím pridáš alebo odstrániš X. Časy môžeš prepísať alebo úplne vymazať.</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {[0,1].map(i=><button
              key={i}
              onClick={()=>setServiceSlots(s=>i===0?[!s[0],s[1]]:[s[0],!s[1]])}
              className={"rounded-[16px] border px-4 py-4 text-center "+(serviceSlots[i]?"border-black bg-black text-white":"border-black/10 bg-white text-black")}
            >
              <div className="text-[20px] font-bold leading-none">{serviceSlots[i]?"X":"+"}</div>
              <div className="mt-1 text-[9px] font-semibold">{i+1}. služba</div>
            </button>)}
          </div>

          <div className="mt-4 space-y-3">
            {[0,1].map(i=><div key={i} className="rounded-[16px] bg-black/[.03] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold">Individuálna príprava {i+1}</p>
                <button onClick={()=>setIpSlots(v=>i===0?["","",v[2],v[3]]:[v[0],v[1],"",""])} className="text-[9px] font-medium text-black/35">Vymazať</button>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="time"
                  value={ipSlots[i*2]}
                  onChange={e=>setIpSlots(v=>{const n=[...v] as [string,string,string,string];n[i*2]=e.target.value;return n})}
                  className="min-w-0 rounded-[12px] border border-black/10 bg-white px-3 py-2 text-[11px] outline-none"
                />
                <span className="text-[10px] text-black/30">–</span>
                <input
                  type="time"
                  value={ipSlots[i*2+1]}
                  onChange={e=>setIpSlots(v=>{const n=[...v] as [string,string,string,string];n[i*2+1]=e.target.value;return n})}
                  className="min-w-0 rounded-[12px] border border-black/10 bg-white px-3 py-2 text-[11px] outline-none"
                />
              </div>
            </div>)}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={()=>setSelectedDate(null)} className="rounded-[15px] bg-black/[.045] px-4 py-3 text-[11px] font-semibold">Zrušiť</button>
            <button onClick={saveSelectedDay} className="rounded-[15px] bg-black px-4 py-3 text-[11px] font-semibold text-white">Uložiť do EPČ</button>
          </div>
        </div>
      </div>
    </div>}

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
