"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, ExternalLink, ChevronRight } from "lucide-react"

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

  const featured=filtered[0]
  const rest=filtered.slice(1)

  return <div className="-mx-5 -mt-2 min-h-svh bg-[#1d1d1f] text-white">
    <header className="border-b border-white/[.08] bg-[#111]/95 px-5 pb-4 pt-5 backdrop-blur-xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[.14em] text-white/42">Slovenská filharmónia</p>
          <h1 className="mt-1 text-[34px] font-medium leading-none tracking-[-.045em]">Koncerty</h1>
        </div>
        <span className="text-[10px] text-white/35">{filtered.length} záznamov</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-2 border-t border-white/[.08] pt-3 text-[11px] text-white/78">
        <span className="border-b border-white/[.10] py-2">Skladatelia</span>
        <span className="border-b border-white/[.10] py-2">Dirigenti</span>
        <span className="border-b border-white/[.10] py-2">Sólisti</span>
        <span className="border-b border-white/[.10] py-2">Súbory</span>
        <span className="border-b border-white/[.10] py-2">Sezóny</span>
        <span className="border-b border-white/[.10] py-2">Diela</span>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"/>
        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Hľadať v archíve"
          className="h-11 w-full rounded-[10px] border border-white/[.08] bg-white/[.06] pl-10 pr-4 text-[13px] text-white outline-none placeholder:text-white/32"
        />
      </div>
    </header>

    <main className="px-5 pb-8 pt-5">
      {featured&&(()=>{
        const thumb=officialThumbs[featured.id]||featured.thumbnailUrl||""
        const date=featured.date?new Date(featured.date+"T00:00:00"):null
        return <section>
          <a href={featured.url||"#"} target="_blank" rel="noreferrer" className="group block">
            <div className="relative overflow-hidden rounded-[8px] bg-black">
              <div className="relative aspect-[1.55/1]">
                {thumb&&<img src={thumb} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.01]"/>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/18 to-transparent"/>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="bg-[#ffd500] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[.04em] text-black">Koncert</span>
                    {date&&<span className="text-[10px] text-white/62">{date.toLocaleDateString("sk-SK",{day:"numeric",month:"short",year:"numeric"})}</span>}
                  </div>
                  <h2 className="max-w-[90%] text-[26px] font-medium leading-[1.03] tracking-[-.035em]">{featured.title}</h2>
                  {featured.conductor&&<p className="mt-2 text-[11px] text-white/64">Diriguje: {featured.conductor}</p>}
                  <div className="mt-4 inline-flex items-center gap-2 rounded-[6px] bg-white/18 px-4 py-2.5 text-[11px] font-medium backdrop-blur">
                    Otvoriť koncert <ExternalLink className="h-3.5 w-3.5"/>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </section>
      })()}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-medium tracking-[-.035em]">Koncertný archív</h2>
            <p className="mt-1 text-[11px] text-white/42">Záznamy od januára 2026.</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-white/55">Všetko <ChevronRight className="h-3 w-3"/></span>
        </div>

        <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {rest.map(v=>{
            const thumb=officialThumbs[v.id]||v.thumbnailUrl||""
            const date=v.date?new Date(v.date+"T00:00:00"):null
            return <a key={v.id} href={v.url||"#"} target="_blank" rel="noreferrer" className="w-[78%] shrink-0 snap-start overflow-hidden rounded-[7px] bg-[#0c0c0d]">
              <div className="relative aspect-[16/10] bg-black">
                {thumb&&<img src={thumb} alt="" className="h-full w-full object-cover"/>}
                <div className="absolute inset-x-0 bottom-0 flex items-center bg-black/72 text-[9px]">
                  <span className="bg-[#ffd500] px-2.5 py-1.5 font-medium uppercase tracking-[.03em] text-black">Koncert</span>
                  {date&&<span className="px-2.5 text-white/65">{date.toLocaleDateString("sk-SK",{day:"numeric",month:"short",year:"numeric"})}</span>}
                </div>
              </div>
              <div className="p-3.5">
                <h3 className="text-[17px] font-normal leading-[1.08] tracking-[-.025em]">{v.title}</h3>
                {v.conductor&&<p className="mt-2 line-clamp-1 text-[10px] text-white/45">Diriguje: {v.conductor}</p>}
              </div>
            </a>
          })}
        </div>
      </section>

      {query&&filtered.length===0&&<div className="mt-8 rounded-[8px] border border-white/[.08] p-8 text-center text-[12px] text-white/40">Nič sa nenašlo.</div>}
    </main>
  </div>
}
