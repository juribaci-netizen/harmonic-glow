'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { setManualService,setManualIpTime } from '@/app/actions/time-entries'
import { saveEpcSignature,saveEpcEnsemble } from '@/app/actions/epc-signature'
import { saveEpcName } from '@/app/actions/profile'
import { EpcForm, type EpcFormHandle } from './epc-form'
import { MONTHS,parseRange,type Entry,type Slot,type Ensemble } from '@/lib/epc/model'

type Report={submissionIssues?:string[];shortfalls?:{weekStart:string;missingHours:number}[];weeklyTotals?:{weekStart:string;totalHours:number}[];entries:Entry[];signatureData:string|null;ensemble:Ensemble|null;fullName:string}
export function TimesheetView({initialEntries,year:initialYear,month:initialMonth,userId,fullName,pdfEditor=false}:{initialEntries:Entry[];year:number;month:number;userId:string;fullName:string;pdfEditor?:boolean}) {
  const router=useRouter(),editor=useRef<EpcFormHandle>(null)
  const [savingAll,setSavingAll]=useState(false)
  const [sharing,setSharing]=useState(false),[shareFallback,setShareFallback]=useState(false)
  const [cursor,setCursor]=useState({year:initialYear,month:initialMonth})
  const {year,month}=cursor
  const [report,setReport]=useState<Report>({entries:initialEntries,signatureData:null,ensemble:null,fullName})
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('')
  const [dirty,setDirty]=useState<Record<string,boolean>>({})
  const [signing,setSigning]=useState(false),[hasInk,setHasInk]=useState(false)
  const canvas=useRef<HTMLCanvasElement>(null),drawing=useRef(false),requestId=useRef(0),inFlight=useRef(false)
  const locked=loading||saving||sharing,hasDrafts=Object.values(dirty).some(Boolean)
  const dirtyChanged=useCallback((key:string,value:boolean)=>setDirty(state=>({...state,[key]:value})),[])
  const fetchReport=async(y:number,m:number)=>{
    const response=await fetch(`/api/epc-report?year=${y}&month=${m}`,{cache:'no-store'})
    if(!response.ok)throw new Error('Výkaz sa nepodarilo načítať. Skúste to znova.')
    return await response.json() as Report
  }
  useEffect(()=>{
    let cancelled=false
    const id=++requestId.current
    setLoading(true);setError('');setStatus('');setDirty({});setReport({entries:[],signatureData:null,ensemble:null,fullName})
    ;(async()=>{
      let next=await fetchReport(year,month)
      // Previous versions were single-user and stored signatures locally. Import without deleting or replacing them.
      try {
        const scoped=localStorage.getItem(`epc-signature:${userId}:${year}-${month}`)
        const legacy=userId==='worktime-demo-user'?localStorage.getItem(`epc-signature:${year}-${month}`):null
        if(!next.signatureData&&(scoped||legacy)) next={...next,...await saveEpcSignature(year,month,scoped||legacy!,true)}
        const choice=userId==='worktime-demo-user'?localStorage.getItem(`epc-ensemble-v3:${year}-${month}`):null
        if(!next.ensemble&&choice&&['orchester','zbor','sko'].includes(choice))next={...next,...await saveEpcEnsemble(year,month,choice as Ensemble,true)}
      }catch{if(!cancelled)setError('Starší lokálny podpis alebo výber súboru sa nepodarilo preniesť; pôvodná kópia zostáva zachovaná.')}
      if(!cancelled&&id===requestId.current)setReport(next)
    })().catch(e=>{if(!cancelled)setError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)})
    return()=>{cancelled=true}
  },[year,month,userId])
  useEffect(()=>{
    const refresh=()=>{
      if(locked||hasDrafts||inFlight.current)return
      const id=requestId.current
      fetchReport(year,month).then(next=>{if(id===requestId.current&&!inFlight.current)setReport(next)}).catch(()=>{})
    }
    const timer=setInterval(refresh,60000)
    const resume=()=>{if(document.visibilityState==='visible')refresh()}
    window.addEventListener('focus',refresh)
    document.addEventListener('visibilitychange',resume)
    return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',resume)}
  },[year,month,locked,hasDrafts])
  const mutate=async(action:()=>Promise<unknown>)=>{
    if(inFlight.current)throw new Error('Prebieha ukladanie.')
    inFlight.current=true;setSaving(true);setError('');setStatus('Ukladám…')
    try {const result=await action();if(result&&typeof result==='object'&&'error' in result&&typeof result.error==='string')throw new Error(result.error);setReport(await fetchReport(year,month));setStatus('Uložené')}
    catch(e){setError(e instanceof Error?e.message:'Zmenu sa nepodarilo uložiť.');setStatus('');throw e}
    finally{inFlight.current=false;setSaving(false)}
  }
  const saveService=(date:string,slot:Slot,value:boolean)=>mutate(()=>setManualService(date,slot,value))
  const saveName=async(value:string)=>{
    if(!value.trim()||value.trim().length>150){
      const message='Zadajte meno a priezvisko (najviac 150 znakov).'
      setError(message);throw new Error(message)
    }
    await mutate(()=>saveEpcName(value))
  }
  const saveRange=async(date:string,slot:Slot,value:string)=>{
    const range=parseRange(value)
    if(!range){setError('Zadajte čas od–do, napríklad 09:00-13:00; koniec musí byť neskôr ako začiatok.');throw new Error('Neplatný čas.')}
    await mutate(()=>setManualIpTime(date,slot,range[0],range[1]))
  }
  const changeMonth=(delta:number)=>{
    const next=new Date(year,month+delta,1)
    setCursor({year:next.getFullYear(),month:next.getMonth()})
  }
  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const r=e.currentTarget.getBoundingClientRect()
    return {x:(e.clientX-r.left)*e.currentTarget.width/r.width,y:(e.clientY-r.top)*e.currentTarget.height/r.height}
  }
  const startSign=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true
    const p=point(e),ctx=e.currentTarget.getContext('2d')!;ctx.beginPath();ctx.moveTo(p.x,p.y)
  }
  const drawSign=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    if(!drawing.current)return
    const p=point(e),ctx=e.currentTarget.getContext('2d')!
    ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#111';ctx.lineTo(p.x,p.y);ctx.stroke();setHasInk(true)
  }
  const confirmSign=async()=>{
    if(!hasInk||!canvas.current)return
    const data=canvas.current.toDataURL('image/png')
    try {
      await mutate(()=>saveEpcSignature(year,month,data))
      try{localStorage.setItem(`epc-signature:${userId}:${year}-${month}`,data)}catch{}
      setSigning(false)
    }catch{}
  }
  const pdfUrl=`/api/epc-pdf?year=${year}&month=${month}`
  const sendIssues=[...(report.submissionIssues??['Kontrola výkazu ešte nie je dokončená.']),...(hasDrafts?['Uložte rozpracované zmeny.']:[])]
  const sharePdf=async()=>{
    if(locked||hasDrafts||sendIssues.length)return
    setSharing(true);setError('');setStatus('')
    try{
      const response=await fetch(`${pdfUrl}&send=1`,{cache:'no-store'})
      if(!response.ok){
        if(response.status===422){
          const data=await response.json() as {issues:string[]}
          setReport(current=>({...current,submissionIssues:data.issues}));return
        }
        throw new Error('PDF sa nepodarilo pripraviť. Skúste to znova.')
      }
      const file=new File([await response.blob()],`EPC-${year}-${String(month+1).padStart(2,'0')}.pdf`,{type:'application/pdf'})
      if(navigator.canShare?.({files:[file]})&&navigator.share){
        await navigator.share({files:[file],title:`EPČ · ${MONTHS[month]} ${year}`})
      }else setShareFallback(true)
    }catch(error){
      if(!(error instanceof DOMException&&error.name==='AbortError')){
        if(error instanceof DOMException&&error.name==='NotAllowedError')setShareFallback(true)
        else setError(error instanceof Error?error.message:'PDF sa nepodarilo zdieľať.')
      }
    }finally{setSharing(false)}
  }
  const saveChanges=async(goBack=false)=>{
    if(locked||savingAll)return
    setSavingAll(true);setError('');setStatus('Ukladám…')
    try {
      if(!editor.current||!await editor.current.saveChanges()){setStatus('');return}
      setStatus('Všetky zmeny sú uložené')
      if(goBack)router.push('/timesheet')
    }finally{setSavingAll(false)}
  }
  return <div className="space-y-5">
    {pdfEditor&&<div className="sticky top-14 z-20 -mx-2 border-b border-black/10 bg-white/95 px-2 py-3 sm:-mx-5 sm:px-5 backdrop-blur-xl">
      <div className="flex flex-wrap gap-2">
        {pdfEditor&&<button type="button" disabled={locked||savingAll} onPointerDown={e=>e.preventDefault()} onClick={()=>void saveChanges(true)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-black/15 px-3 text-xs font-medium disabled:opacity-40"><ArrowLeft className="h-4 w-4" aria-hidden="true"/>Späť do aplikácie</button>}
      </div>
      <p aria-live="polite" className="mt-1.5 text-xs text-black/60 empty:hidden">{error||((savingAll||saving)?'Ukladám zmeny…':hasDrafts?'Máte neuložené zmeny.':status)}</p>
    </div>}
    <header className="pt-1"><p className="modern-kicker text-black/50">Evidencia pracovného času</p>{pdfEditor&&<h1 className="ios-title mt-1">Úprava PDF</h1>}</header>
    <section className="rounded-[22px] border border-black/10 bg-white">
      <div className="grid grid-cols-[44px_1fr_44px] items-center border-b border-black/10 p-3">
        <button aria-label="Predchádzajúci mesiac" disabled={locked||hasDrafts} onClick={()=>changeMonth(-1)} className="flex h-11 items-center justify-center rounded-full disabled:opacity-30"><ChevronLeft/></button>
        <h2 className="text-center text-[18px] font-semibold">{MONTHS[month]} {year}</h2>
        <button aria-label="Nasledujúci mesiac" disabled={locked||hasDrafts} onClick={()=>changeMonth(1)} className="flex h-11 items-center justify-center rounded-full disabled:opacity-30"><ChevronRight/></button>
      </div>
      {error&&<p role="alert" className="mx-3 mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      <p role="status" aria-live="polite" className="px-3 text-xs text-black/60 empty:hidden">{loading?'Načítavam výkaz…':saving?status:hasDrafts?'Neuložená zmena':status}</p>
      {!loading&&<EpcForm editorRef={editor} key={`${year}-${month}`} entries={report.entries} year={year} month={month} name={report.fullName} signatureData={report.signatureData} ensemble={report.ensemble} zoom={1} busy={saving} showPlannedPreparation onService={saveService} onRange={saveRange} onName={saveName} onEnsemble={value=>mutate(()=>saveEpcEnsemble(year,month,value))} onDirty={dirtyChanged}/>}
      <div className="grid grid-cols-2 gap-3 p-3">
        <a href={locked||hasDrafts?undefined:`${pdfUrl}&download=1`} aria-disabled={locked||hasDrafts} download={`EPC-${year}-${String(month+1).padStart(2,'0')}.pdf`} className={`block rounded-xl border border-black/15 bg-white px-4 py-3 text-center text-sm font-medium text-black ${locked||hasDrafts?'pointer-events-none opacity-40':''}`}>Stiahnuť</a>
        <button disabled={locked||hasDrafts} onClick={()=>{setHasInk(false);setSigning(true)}} className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-40">Podpísať</button>
        {!loading&&sendIssues.length>0&&<div id="send-issues" role="alert" className="col-span-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">Pred odoslaním opravte:</p><ul className="mt-1 list-disc space-y-1 pl-5">{sendIssues.map(issue=><li key={issue}>{issue}</li>)}</ul></div>}
        <button type="button" disabled={locked||hasDrafts||sendIssues.length>0} aria-describedby={sendIssues.length?'send-issues':undefined} onClick={()=>void sharePdf()} className="col-span-2 min-h-14 rounded-xl bg-[#a8e6a3] px-4 py-4 text-base font-semibold text-[#163b20] transition-colors hover:bg-[#93d98d] disabled:opacity-40">{sharing?'Pripravujem PDF…':'Odoslať'}</button>
      </div>
    </section>
    {shareFallback&&<div role="dialog" aria-modal="true" aria-labelledby="send-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" onKeyDown={e=>{if(e.key==='Escape')setShareFallback(false)}}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h2 id="send-title" className="text-xl font-semibold">Odoslať výkaz</h2>
        <p className="mt-3 text-sm text-black/70">Tento prehliadač nepodporuje priame zdieľanie PDF. Stiahni výkaz a prilož ho k e-mailu alebo správe.</p>
        <a href={`${pdfUrl}&download=1&send=1`} download className="mt-4 block rounded-xl bg-[#78552f] p-3 text-center font-medium text-white">Stiahnuť PDF</a>
        <button autoFocus type="button" onClick={()=>setShareFallback(false)} className="mt-3 w-full rounded-xl border border-black/15 p-3">Zavrieť</button>
      </div>
    </div>}
    {signing&&<div role="dialog" aria-modal="true" aria-labelledby="signature-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h2 id="signature-title" className="text-xl font-semibold">Podpis · {MONTHS[month]} {year}</h2>
        <canvas aria-label="Podpis zamestnanca" ref={canvas} width={720} height={260} onPointerDown={startSign} onPointerMove={drawSign} onPointerUp={()=>{drawing.current=false}} onPointerCancel={()=>{drawing.current=false}} className="mt-3 h-[170px] w-full touch-none rounded-xl border border-black/20"/>
        <div className="mt-3 flex justify-between text-sm"><button disabled={saving} onClick={()=>{canvas.current?.getContext('2d')?.clearRect(0,0,720,260);setHasInk(false)}}>Vymazať kresbu</button><button disabled={saving} onClick={()=>setSigning(false)}>Zrušiť</button></div>
        {error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
        <button disabled={!hasInk||saving} onClick={confirmSign} className="mt-4 w-full rounded-xl bg-black p-3 text-sm text-white disabled:opacity-40">{saving?'Ukladám…':'Uložiť podpis'}</button>
      </div>
    </div>}
  </div>
}
