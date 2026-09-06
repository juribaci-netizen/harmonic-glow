"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Play } from "lucide-react"

type Video={id:number;title:string;date:string|null;conductor:string|null;venue:string|null;description:string|null;url:string|null;thumbnailUrl:string|null}

export function VideosView({initialVideos}:{initialVideos:Video[]}){
 const [query,setQuery]=useState("")
 const [filter,setFilter]=useState("all")
 const filtered=useMemo(()=>initialVideos.filter(v=>{const q=query.toLowerCase().trim();const hay=[v.title,v.conductor,v.venue,v.description].filter(Boolean).join(" ").toLowerCase();return (filter==="all"||v.date?.startsWith(filter))&&hay.includes(q)}),[initialVideos,query,filter])
 const years=Array.from(new Set(initialVideos.map(v=>v.date?.slice(0,4)).filter(Boolean))).sort().reverse()
 return <div className="space-y-4 pb-3">
  <header><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a93a6]">Slovenská filharmónia</p><h1 className="font-serif text-[30px] font-semibold tracking-tight">Koncerty</h1><p className="mt-1 text-xs text-muted-foreground">Objavuj koncerty, skladateľov, dirigentov a programy.</p></header>
  <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hľadať koncert alebo skladateľa…" className="h-11 rounded-xl pl-9"/></div>
  <div className="flex gap-2 overflow-x-auto pb-1"><button onClick={()=>setFilter("all")} className={`rounded-full px-4 py-2 text-xs font-medium ${filter==="all"?"bg-[#17233d] text-white":"bg-[#f0f4fa]"}`}>Všetko</button>{years.map(y=><button key={y} onClick={()=>setFilter(y!)} className={`rounded-full px-4 py-2 text-xs font-medium ${filter===y?"bg-[#eaf1ff] text-blue-700":"bg-[#f0f4fa]"}`}>{y}</button>)}</div>
  {filtered.length===0?<Card className="p-10 text-center text-sm text-muted-foreground">Nič sa nenašlo.</Card>:<div className="grid gap-3 sm:grid-cols-2">{filtered.map(v=><Card key={v.id} className="group overflow-hidden rounded-2xl border-0 shadow-sm"><a href={v.url||undefined} target="_blank" rel="noreferrer" className={v.url?"block":"block pointer-events-none"}><div className="relative aspect-[16/9] overflow-hidden bg-[#dfe5ef]">{v.thumbnailUrl?<img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"/>:<div className="flex h-full items-end bg-gradient-to-br from-[#17233d] via-[#465673] to-[#d9e1ed] p-4"><p className="max-w-[80%] font-serif text-lg font-semibold text-white">{v.title}</p></div>}{v.url&&<span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#17233d] shadow-lg"><Play className="ml-0.5 h-3.5 w-3.5 fill-current"/></span>}</div></a><div className="p-3.5"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{v.date?new Date(v.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"long",year:"numeric"}):""}</p><h2 className="mt-1 font-serif text-[17px] font-semibold leading-tight">{v.title}</h2>{v.conductor&&<p className="mt-1 text-[11px] text-muted-foreground">Dirigent: <span className="font-medium text-foreground">{v.conductor}</span></p>}{v.venue&&<p className="mt-0.5 text-[11px] text-muted-foreground">{v.venue}</p>}{v.description&&<p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{v.description}</p>}{v.url&&<p className="mt-2 text-[11px] font-medium text-[#17233d]">▶ Prehrať video</p>}</div></Card>)}</div>}
 </div>
}
