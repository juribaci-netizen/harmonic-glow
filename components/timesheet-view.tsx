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
  }

  useEffect(()=>{load(cursor.getFullYear(),cursor.getMonth())},[cursor])

  const monthName=cursor.toLocaleDateString(locale,{month:"long",year:"numeric"})
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
    if(canvas)setSignatureData(canvas.toDataURL("image/png"))
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
              <div className={"relative mx-auto aspect-[768/1024] w-full overflow-hidden bg-white "+(pdfEditing?"ring-2 ring-black/10":"")}>
                <img
                  src="https://d2jqrm6oza8nb6.cloudfront.net/datasets/782e1996-0e57-4913-acfa-bb7ef190db2a.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYzZhOTJmYmYyMDk3MWM3NSIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc4OTA5NDk3NX0.-q7mt5YO58etpmgdTHFjADNJHIM2XdO6nU6TpltXNfQ"
                  alt="EPČ"
                  className="absolute inset-0 h-full w-full object-fill"
                />
                <div className={"absolute inset-0 text-black "+(pdfEditing?"pointer-events-auto":"pointer-events-none")}>
                  <span className="absolute left-[42%] top-[5.85%] -translate-x-1/2 -translate-y-1/2 text-[clamp(7px,1.05vw,13px)] font-semibold">{monthName.split(" ")[0]}</span>
                  <span className="absolute left-[56.5%] top-[5.85%] -translate-x-1/2 -translate-y-1/2 text-[clamp(7px,1.05vw,13px)] font-semibold">{cursor.getFullYear()}</span>
                  <span className="absolute left-[44.5%] top-[9.25%] -translate-x-1/2 -translate-y-1/2 text-[clamp(8px,1.2vw,15px)] font-semibold">Marek Juráň</span>
                  <span className="absolute left-[69.2%] top-[10.2%] -translate-x-1/2 -translate-y-1/2 text-[clamp(7px,1.3vw,11px)] font-bold">X</span>
                  {signed&&signatureData&&<img
                    src={signatureData}
                    alt="Podpis zamestnanca"
                    className="absolute left-[61.5%] top-[86.9%] h-[4.2%] w-[22%] object-contain"
                  />}
                  {visibleDays.flatMap(([date,es])=>{
                    const day=Number(date.slice(-2))
                    const y=20.45+(day-1)*2.18
                    const work=es.filter(e=>e.type!=="individual"&&e.type!=="ip")
                    const ip=es.filter(e=>e.type==="individual"||e.type==="ip")
                    const ipHours=ip.reduce((s,e)=>s+Number(e.hours),0)
                    return [
                      ...(work.length>=1?[<span key={date+"-s1"} className="absolute left-[20.2%] -translate-x-1/2 -translate-y-1/2 text-[clamp(7px,1.45vw,11px)] font-bold" style={{top:y+"%"}}>X</span>]:[]),
                      ...(work.length>=2?[<span key={date+"-s2"} className="absolute left-[29.2%] -translate-x-1/2 -translate-y-1/2 text-[clamp(7px,1.45vw,11px)] font-bold" style={{top:y+"%"}}>X</span>]:[]),
                      ...(ipHours>0?[<span key={date+"-ip"} className="absolute left-[79.5%] -translate-x-1/2 -translate-y-1/2 text-[clamp(5px,1vw,8px)] font-medium" style={{top:y+"%"}}>{ipLabel(ipHours,work.length>0)}</span>]:[])
                    ]
                  })}
                </div>
                <div className="absolute inset-0 z-20">
                  {Array.from({length:new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()},(_,i)=>i+1).map(day=>{
                    const date=cursor.getFullYear()+"-"+String(cursor.getMonth()+1).padStart(2,"0")+"-"+String(day).padStart(2,"0")
                    const isPast=cursor.getFullYear()<today.getFullYear() || (cursor.getFullYear()===today.getFullYear()&&cursor.getMonth()<today.getMonth()) || new Date(date+"T23:59:59")<=today
                    const top=19.34+(day-1)*2.18
                    return <button
                      key={date}
                      disabled={!isPast}
                      onClick={()=>openDay(date)}
                      className="absolute left-[9%] right-[6%] rounded-[3px] bg-transparent active:bg-black/[.045] disabled:pointer-events-none"
                      style={{top:top+"%",height:"2.05%"}}
                      aria-label={"Otvoriť EPČ "+day+". deň"}
                    />
                  })}
                </div>
              </div>
              <button onClick={()=>setPdfEditing(v=>!v)} className="mt-3 block w-full rounded-[13px] bg-black/[.06] px-3 py-3 text-center text-[10px] font-semibold">
                {pdfEditing?"Hotovo":"Upraviť priamo v EPČ"}
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
