"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Play, ArrowLeft, ExternalLink } from "lucide-react"

type Video={id:number;title:string;date:string|null;conductor:string|null;venue:string|null;description:string|null;url:string|null;thumbnailUrl:string|null}

export function VideosView({initialVideos}:{initialVideos:Video[]}){
 const [query,setQuery]=useState("")
 const [filter,setFilter]=useState("all")
 const [selected,setSelected]=useState<Video|null>(null)
 const filtered=useMemo(()=>initialVideos.filter(v=>{const q=query.toLowerCase().trim();const hay=[v.title,v.conductor,v.venue,v.description].filter(Boolean).join(" ").toLowerCase();return (filter==="all"||v.date?.startsWith(filter))&&hay.includes(q)}),[initialVideos,query,filter])
 const years=Array.from(new Set(initialVideos.map(v=>v.date?.slice(0,4)).filter(Boolean))).sort().reverse()
 const openVideo=(v:Video)=>{if(v.url)setSelected(v)}
 if(selected)return <div className="space-y-4 pb-4">
  <button onClick={()=>setSelected(null)} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"><ArrowLeft className="h-4 w-4"/>Späť na koncerty</button>
  <header><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a93a6]">Slovenská filharmónia · koncert</p><h1 className="mt-1 font-serif text-[27px] font-semibold leading-tight">{selected.title}</h1><p className="mt-1 text-xs text-muted-foreground">{selected.date?new Date(selected.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"long",year:"numeric"}):""}{selected.venue?` · ${selected.venue}`:""}</p></header>
  <Card className="overflow-hidden rounded-2xl border-0 bg-black shadow-lg"><div className="aspect-video w-full bg-black"><iframe src={selected.url||undefined} title={selected.title} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div></Card>
  <div className="rounded-2xl bg-[#f5f7fa] p-4"><p className="text-sm font-medium">Prehrávanie v aplikácii</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Každý záznam používa svoj vlastný oficiálny koncertný odkaz. Ak prehliadač nepovolí vložené prehrávanie, otvor rovnaký záznam priamo na SF.</p>{selected.conductor&&<p className="mt-3 text-xs"><span className="text-muted-foreground">Dirigent:</span> {selected.conductor}</p>}<a href={selected.url||"#"} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#17233d]">Otvoriť na SF <ExternalLink className="h-3 w-3"/></a></div>
 </div>
 return <div className="space-y-4 pb-3">
  <header><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a93a6]">Slovenská filharmónia</p><h1 className="font-serif text-[30px] font-semibold tracking-tight">Koncerty</h1><p className="mt-1 text-xs text-muted-foreground">Objavuj koncerty, skladateľov, dirigentov a programy.</p></header>
  <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hľadať koncert alebo skladateľa…" className="h-11 rounded-xl pl-9"/></div>
  <div className="flex gap-2 overflow-x-auto pb-1">{["all",...years].map(y=><button key={y} onClick={()=>setFilter(y)} className={`rounded-full px-4 py-2 text-xs font-medium ${filter===y?"bg-[#17233d] text-white":"bg-[#f0f4fa]"}`}>{y==="all"?"Všetko":y}</button>)}</div>
  {filtered.length===0?<Card className="p-10 text-center text-sm text-muted-foreground">Nič sa nenašlo.</Card>:<div className="grid grid-cols-2 gap-3">{filtered.map(v=><Card key={v.id} className="group overflow-hidden rounded-2xl border-0 shadow-sm"><button onClick={()=>openVideo(v)} className="block w-full text-left"><div className="relative aspect-[16/10] overflow-hidden bg-[#dfe5ef]">{v.thumbnailUrl?<img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"/>:<div className="flex h-full items-end bg-gradient-to-br from-[#17233d] via-[#465673] to-[#d9e1ed] p-3"><p className="font-serif text-sm font-semibold text-white">{v.title}</p></div>}{v.url&&<span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#17233d] shadow-lg"><Play className="ml-0.5 h-3 w-3 fill-current"/></span>}</div></button><div className="p-3"><p className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{v.date?new Date(v.date+"T00:00:00").toLocaleDateString("sk-SK",{day:"numeric",month:"short",year:"numeric"}):""}</p><h2 className="mt-1 line-clamp-2 font-serif text-[15px] font-semibold leading-tight">{v.title}</h2>{v.conductor&&<p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{v.conductor}</p>}{v.venue&&<p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{v.venue}</p>}</div></Card>)}</div>}
 </div>
}
