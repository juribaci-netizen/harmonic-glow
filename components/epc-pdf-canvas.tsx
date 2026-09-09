"use client"

import { useEffect, useRef, useState } from "react"

export function EpcPdfCanvas({url,title}:{url:string;title:string}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    let cancelled=false
    ;(async()=>{
      try{
        const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs")
                const res=await fetch(url,{cache:"no-store"})
        if(!res.ok)throw new Error("PDF fetch failed")
        const data=new Uint8Array(await res.arrayBuffer())
        const doc=await pdfjs.getDocument({data,disableWorker:true}).promise
        const page=await doc.getPage(1)
        const canvas=canvasRef.current
        if(!canvas||cancelled)return
        const parent=canvas.parentElement
        const targetWidth=Math.max(320,parent?.clientWidth||595)
        const base=page.getViewport({scale:1})
        const scale=targetWidth/base.width
        const viewport=page.getViewport({scale})
        const dpr=window.devicePixelRatio||1
        canvas.width=Math.floor(viewport.width*dpr)
        canvas.height=Math.floor(viewport.height*dpr)
        canvas.style.width=viewport.width+"px"
        canvas.style.height=viewport.height+"px"
        const ctx=canvas.getContext("2d")
        if(!ctx)throw new Error("No canvas context")
        ctx.setTransform(dpr,0,0,dpr,0,0)
        await page.render({canvasContext:ctx,viewport}).promise
        if(!cancelled)setError(null)
      }catch{
        if(!cancelled)setError(true)
      }
    })()
    return()=>{cancelled=true}
  },[url])

  return <div className="w-full bg-white">
    <canvas ref={canvasRef} aria-label={title} className="block h-auto w-full bg-white"/>
    {error&&<div className="rounded-[14px] bg-black/[.035] p-4 text-center text-[10px] text-black/45">
      Náhľad PDF sa nepodarilo vykresliť. Otvor PDF tlačidlom nižšie.
    </div>}
  </div>
}
