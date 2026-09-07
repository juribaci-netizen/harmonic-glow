"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Play, ExternalLink, MapPin } from "lucide-react"

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
      <p className="mt-2 text-[12px] leading-5 text-black/42">Scrolluj archívom a otvor si konkrétny záznam na oficiálnom streame.</p>
    </header>

    <div className="sticky top-[58px] z-20 -mx-1 bg-white/88 px-1 py-2 backdrop-blur-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"/>
        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Hľadať koncert, skladateľa, dirigenta"
          className="h-11 w-full rounded-[14px] border border-black/[.05] bg-[#f5f5f7] pl-10 pr-4 text-[13px] outline-none placeholder:text-black/34"
        />
      </div>
    </div>

    <div className="space-y-8">
      {filtered.map((v,index)=>{
        const thumb=officialThumbs[v.id]||v.thumbnailUrl||""
        const date=v.date?new Date(v.date+"T00:00:00"):null
        return <article key={v.id} className="border-b border-black/[.06] pb-8 last:border-b-0">
          <a href={v.url||"#"} target="_blank" rel="noreferrer" className="group block">
            <div className="relative overflow-hidden rounded-[22px] bg-black shadow-[0_16px_42px_rgba(0,0,0,.12)]">
              <div className="relative aspect-video">
                {thumb&&<img src={thumb} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.01]"/>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5"/>
                <span className="absolute left-4 top-4 rounded-full bg-black/38 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[.08em] text-white/85 backdrop-blur-md">
                  {index===0?"Posledné":"Archív"}
                </span>
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-xl">
                  <Play className="ml-1 h-5 w-5 fill-current"/>
                </span>
                {date&&<div className="absolute bottom-4 left-4 text-white">
                  <p className="text-[11px] font-normal text-white/72">{date.toLocaleDateString("sk-SK",{day:"numeric",month:"long",year:"numeric"})}</p>
                </div>}
              </div>
            </div>
          </a>

          <div className="px-1 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-[24px] font-normal leading-[1.02] tracking-[-.04em] text-black">{v.title}</h2>
                {v.conductor&&<p className="mt-2 text-[12px] font-normal text-black/55">Diriguje: {v.conductor}</p>}
                {v.venue&&<p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-black/38"><MapPin className="h-3 w-3"/>{v.venue}</p>}
                {v.description&&<p className="mt-3 line-clamp-2 text-[11px] leading-5 text-black/42">{v.description}</p>}
              </div>
              <a href={v.url||"#"} target="_blank" rel="noreferrer" className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[.08] bg-white text-black/55">
                <ExternalLink className="h-3.5 w-3.5"/>
              </a>
            </div>
          </div>
        </article>
      })}
    </div>

    {filtered.length===0&&<div className="apple-card rounded-[18px] p-8 text-center text-[13px] text-black/40">Nič sa nenašlo.</div>}
  </div>
}
