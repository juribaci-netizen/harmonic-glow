"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Play, ExternalLink } from "lucide-react"

type Video={id:number;title:string;date:string|null;conductor:string|null;venue:string|null;description:string|null;url:string|null;thumbnailUrl:string|null}

export function VideosView({initialVideos}:{initialVideos:Video[]}){
  const [query,setQuery]=useState("")
  const [officialThumbs,setOfficialThumbs]=useState<Record<number,string>>({})

  useEffect(()=>{
    let cancelled=false
    Promise.all(initialVideos.filter(v=>v.url).map(async v=>{
      try{
        const r=await fetch("/api/video-embed?preview=1&url="+encodeURIComponent(v.url!))
        const data=r.ok?await r.json():null
        return [v.id,data?.imageUrl??null] as const
      }catch{return [v.id,null] as const}
    })).then(rows=>{
      if(cancelled)return
      const next:Record<number,string>={}
      rows.forEach(([id,url])=>{if(url)next[id]=url})
      setOfficialThumbs(next)
    })
    return()=>{cancelled=true}
  },[initialVideos])

  const filtered=useMemo(()=>initialVideos.filter(v=>{
    const q=query.toLowerCase().trim()
    const hay=[v.title,v.conductor,v.venue,v.description].filter(Boolean).join(" ").toLowerCase()
    return hay.includes(q)
  }),[initialVideos,query])

  return <div className="space-y-5">
    <header className="pt-1">
      <p className="modern-kicker text-black/35">Slovenská filharmónia</p>
      <h1 className="ios-title mt-1">Koncerty</h1>
      <p className="mt-2 text-[12px] text-black/42">Oficiálne záznamy z koncertného archívu.</p>
    </header>

    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"/>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hľadať koncert alebo skladateľa" className="h-11 w-full rounded-[14px] border-0 bg-[#e9e5dc] pl-10 pr-4 text-[13px] outline-none placeholder:text-black/34"/>
    </div>

    <div className="space-y-6">
      {filtered.map(v=><a key={v.id} href={v.url||"#"} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-[24px] bg-black text-left shadow-[0_22px_60px_rgba(0,0,0,.16)]">
        <div className="relative aspect-[2.2/1] bg-black">
          {(officialThumbs[v.id]||v.thumbnailUrl)&&<img src={officialThumbs[v.id]||v.thumbnailUrl||""} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"/>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/10"/><span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-black shadow-xl backdrop-blur"><Play className="ml-0.5 h-4 w-4 fill-current"/></span>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-black/35">{v.date?new Date(v.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"short",year:"numeric"}):""}</p>
          <h2 className="mt-1 line-clamp-2 text-[13px] font-bold leading-tight tracking-[-.01em]">{v.title}</h2>
          {v.conductor&&<p className="mt-1.5 line-clamp-1 text-[11px] text-white/60">Diriguje: {v.conductor}</p>}
          <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-black/45">Otvoriť na streame <ExternalLink className="h-3 w-3"/></p>
        </div>
      </a>)}
    </div>

    {filtered.length===0&&<div className="apple-card rounded-[18px] p-8 text-center text-[13px] text-black/40">Nič sa nenašlo.</div>}
  </div>
}
