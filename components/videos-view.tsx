"use client"

import { useMemo, useState } from "react"
import { Search, Play, ArrowLeft, ExternalLink } from "lucide-react"

type Video={id:number;title:string;date:string|null;conductor:string|null;venue:string|null;description:string|null;url:string|null;thumbnailUrl:string|null}

export function VideosView({initialVideos}:{initialVideos:Video[]}){
  const [query,setQuery]=useState("")
  const [selected,setSelected]=useState<Video|null>(null)

  const filtered=useMemo(()=>initialVideos.filter(v=>{
    const q=query.toLowerCase().trim()
    const hay=[v.title,v.conductor,v.venue,v.description].filter(Boolean).join(" ").toLowerCase()
    return hay.includes(q)
  }),[initialVideos,query])

  const play=(v:Video)=>{
    if(!v.url) return
    window.location.href=v.url
  }

  if(selected)return <div className="space-y-4">
    <button onClick={()=>setSelected(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-black"><ArrowLeft className="h-4 w-4"/>Koncerty</button>

    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Slovenská filharmónia</p>
      <h1 className="ios-title mt-1 text-[30px]">{selected.title}</h1>
      <p className="mt-2 text-[11px] text-black/42">{selected.date?new Date(selected.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"long",year:"numeric"}):""}{selected.venue?" · "+selected.venue:""}</p>
    </header>

    <section className="overflow-hidden rounded-[22px] bg-black shadow-[0_14px_36px_rgba(0,0,0,.16)]">
      <button onClick={()=>play(selected)} className="relative block aspect-video w-full text-left">
        {selected.thumbnailUrl&&<img src={selected.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/5"/>
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-xl">
          <Play className="ml-1 h-5 w-5 fill-current"/>
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="text-[11px] font-semibold">Prehrať oficiálny záznam</p>
          <p className="mt-1 text-[10px] text-white/60">Koncertný archív Slovenskej filharmónie</p>
        </div>
      </button>
    </section>

    <section className="apple-card rounded-[20px] p-4">
      {selected.conductor&&<p className="text-[13px] font-semibold">Diriguje: {selected.conductor}</p>}
      {selected.venue&&<p className="mt-1 text-[11px] text-black/42">{selected.venue}</p>}
      {selected.description&&<p className="mt-3 text-[12px] leading-relaxed text-black/55">{selected.description}</p>}
      <button onClick={()=>play(selected)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-[12px] font-semibold text-white">Prehrať koncert <ExternalLink className="h-3.5 w-3.5"/></button>
    </section>
  </div>

  return <div className="space-y-5">
    <header className="pt-1">
      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Slovenská filharmónia</p>
      <h1 className="ios-title mt-1">Koncerty</h1>
      <p className="mt-2 text-[12px] text-black/42">Oficiálne záznamy z koncertného archívu.</p>
    </header>

    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"/>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hľadať koncert alebo skladateľa" className="h-11 w-full rounded-[14px] border-0 bg-[#e4e4e9] pl-10 pr-4 text-[13px] outline-none placeholder:text-black/34"/>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {filtered.map(v=><button key={v.id} onClick={()=>setSelected(v)} className="apple-card overflow-hidden rounded-[20px] text-left">
        <div className="relative aspect-[4/3] bg-[#202024]">
          {v.thumbnailUrl&&<img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover"/>}
          <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-black shadow-lg"><Play className="ml-0.5 h-3.5 w-3.5 fill-current"/></span>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-black/35">{v.date?new Date(v.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"short",year:"numeric"}):""}</p>
          <h2 className="mt-1 line-clamp-2 text-[13px] font-bold leading-tight tracking-[-.01em]">{v.title}</h2>
          {v.conductor&&<p className="mt-1 line-clamp-1 text-[10px] text-black/40">Diriguje: {v.conductor}</p>}
        </div>
      </button>)}
    </div>

    {filtered.length===0&&<div className="apple-card rounded-[20px] p-8 text-center text-[13px] text-black/40">Nič sa nenašlo.</div>}
  </div>
}
