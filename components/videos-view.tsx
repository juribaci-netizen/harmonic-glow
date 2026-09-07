"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Play, ArrowLeft, ExternalLink, Loader2, ChevronRight } from "lucide-react"

type Video={id:number;title:string;date:string|null;conductor:string|null;venue:string|null;description:string|null;url:string|null;thumbnailUrl:string|null}

export function VideosView({initialVideos}:{initialVideos:Video[]}){
  const [query,setQuery]=useState("")
  const [selected,setSelected]=useState<Video|null>(null)
  const [embedUrl,setEmbedUrl]=useState<string|null>(null)
  const [embedLoading,setEmbedLoading]=useState(false)

  const filtered=useMemo(()=>initialVideos.filter(v=>{
    const q=query.toLowerCase().trim()
    const hay=[v.title,v.conductor,v.venue,v.description].filter(Boolean).join(" ").toLowerCase()
    return hay.includes(q)
  }),[initialVideos,query])

  useEffect(()=>{
    let cancelled=false
    if(!selected?.url){setEmbedUrl(null);return}
    setEmbedLoading(true)
    fetch("/api/video-embed?url="+encodeURIComponent(selected.url))
      .then(r=>r.ok?r.json():null)
      .then(data=>{if(!cancelled)setEmbedUrl(data?.embedUrl??null)})
      .catch(()=>{if(!cancelled)setEmbedUrl(null)})
      .finally(()=>{if(!cancelled)setEmbedLoading(false)})
    return()=>{cancelled=true}
  },[selected])

  if(selected)return <div className="space-y-4">
    <button onClick={()=>setSelected(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0a84ff]"><ArrowLeft className="h-4 w-4"/>Koncerty</button>

    <header><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Slovenská filharmónia</p><h1 className="ios-title mt-1 text-[30px]">{selected.title}</h1><p className="mt-2 text-[11px] text-black/42">{selected.date?new Date(selected.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"long",year:"numeric"}):""}{selected.venue?" · "+selected.venue:""}</p></header>

    <section className="overflow-hidden rounded-[28px] bg-black shadow-xl">
      <div className="relative aspect-video">
        {embedLoading?<div className="absolute inset-0 flex items-center justify-center text-white"><Loader2 className="h-7 w-7 animate-spin"/></div>:
        embedUrl?<iframe src={embedUrl} title={selected.title} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>:
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
          {selected.thumbnailUrl&&<img src={selected.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30"/>}
          <a href={selected.url||"#"} target="_blank" rel="noreferrer" className="relative rounded-full bg-white px-4 py-2 text-[12px] font-bold text-black">Otvoriť koncert <ExternalLink className="ml-1 inline h-3.5 w-3.5"/></a>
        </div>}
      </div>
    </section>

    <section className="apple-card rounded-[24px] p-4">
      {selected.conductor&&<p className="text-[13px] font-semibold">Diriguje: {selected.conductor}</p>}
      {selected.venue&&<p className="mt-1 text-[11px] text-black/42">{selected.venue}</p>}
      {selected.description&&<p className="mt-3 text-[12px] leading-relaxed text-black/55">{selected.description}</p>}
    </section>
  </div>

  return <div className="space-y-5">
    <header className="pt-1"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Slovenská filharmónia</p><h1 className="ios-title mt-1">Koncerty</h1></header>

    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"/>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hľadať koncert alebo skladateľa" className="h-11 w-full rounded-[14px] border-0 bg-[#e4e4e9] pl-10 pr-4 text-[13px] outline-none placeholder:text-black/34 focus:ring-2 focus:ring-[#0a84ff]/25"/>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {filtered.map(v=><button key={v.id} onClick={()=>v.url&&setSelected(v)} className="apple-card overflow-hidden rounded-[22px] text-left">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#161618] to-[#55555c]">
          {v.thumbnailUrl&&<img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover"/>}
          <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-black shadow-lg"><Play className="ml-0.5 h-3.5 w-3.5 fill-current"/></span>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-black/35">{v.date?new Date(v.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"short",year:"numeric"}):""}</p>
          <h2 className="mt-1 line-clamp-2 text-[13px] font-bold leading-tight tracking-[-.01em]">{v.title}</h2>
          {v.conductor&&<p className="mt-1 line-clamp-1 text-[10px] text-black/40">Diriguje: {v.conductor}</p>}
        </div>
      </button>)}
    </div>

    {filtered.length===0&&<div className="apple-card rounded-[24px] p-8 text-center text-[13px] text-black/40">Nič sa nenašlo.</div>}
  </div>
}
