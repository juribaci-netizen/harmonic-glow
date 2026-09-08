import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getMonthEntries } from "@/app/actions/time-entries"
import { getSessionUser } from "@/lib/session"

const monthNames=["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"]

function minutes(time:string|null|undefined){
  if(!time)return null
  const m=time.match(/^(\d{1,2}):(\d{2})$/)
  if(!m)return null
  return Number(m[1])*60+Number(m[2])
}
function hhmm(m:number){
  const safe=Math.max(0,Math.min(23*60+59,Math.round(m)))
  return String(Math.floor(safe/60)).padStart(2,"0")+":"+String(safe%60).padStart(2,"0")
}
function ipRange(entries:any[],hours:number){
  if(hours<=0)return null
  const work=entries.filter(e=>e.type!=="individual"&&e.type!=="ip")
  const starts=work.map(e=>minutes(e.startTime)).filter((x):x is number=>x!==null)
  const ends=work.map(e=>minutes(e.endTime)).filter((x):x is number=>x!==null)
  const dur=Math.round(hours*60)
  let start=10*60
  if(starts.length&&Math.min(...starts)>=14*60){
    start=Math.max(8*60,Math.min(...starts)-dur-60)
  }else if(ends.length){
    start=Math.max(14*60,Math.max(...ends)+60)
  }
  if(start+dur>22*60)start=Math.max(8*60,22*60-dur)
  return [hhmm(start),hhmm(start+dur)] as const
}
function rowY(day:number){ return 688.85-(day-1)*17.52 }

export async function GET(request:Request){
  const user=await getSessionUser()
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})

  const {searchParams}=new URL(request.url)
  const now=new Date()
  const year=Number(searchParams.get("year"))||now.getFullYear()
  const monthRaw=Number(searchParams.get("month"))
  const month=Number.isInteger(monthRaw)&&monthRaw>=0&&monthRaw<=11?monthRaw:now.getMonth()

  const entries=await getMonthEntries(year,month)
  const cutoff = year<now.getFullYear() || (year===now.getFullYear()&&month<now.getMonth())
    ? new Date(year,month+1,0,23,59,59)
    : year===now.getFullYear()&&month===now.getMonth()
      ? now
      : new Date(year,month,0)

  const visible=entries.filter(e=>new Date(e.date+"T23:59:59")<=cutoff && e.status!=="suggested")

  const parts=await Promise.all(Array.from({length:10},(_,i)=>
    readFile(path.join(process.cwd(),"public","epc-template",String(i+1).padStart(2,"0")+".b64"),"utf8")
  ))
  const template=Buffer.from(parts.join(""),"base64")
  const pdf=await PDFDocument.load(template)
  const page=pdf.getPages()[0]
  const font=await pdf.embedFont(StandardFonts.Helvetica)
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold)

  const draw=(text:string,x:number,y:number,size=8,b=false)=>{
    page.drawText(text,{x,y,size,font:b?bold:font,color:rgb(0,0,0)})
  }

  draw(monthNames[month],202,794,9,true)
  draw(String(year),307,794,9,true)
  draw(user.name||user.email,170,764,9,false)
  draw("X",369,757,10,true)

  const byDay=new Map<number,any[]>()
  for(const e of visible){
    const d=Number(String(e.date).slice(-2))
    byDay.set(d,[...(byDay.get(d)||[]),e])
  }

  for(const [day,dayEntries] of byDay){
    const y=rowY(day)
    const work=dayEntries.filter(e=>e.type!=="individual"&&e.type!=="ip")
    if(work.length>=1)draw("X",119,y-3,10,true)
    if(work.length>=2)draw("X",165,y-3,10,true)

    const ipHours=dayEntries.filter(e=>e.type==="individual"||e.type==="ip").reduce((s,e)=>s+Number(e.hours),0)
    const range=ipRange(dayEntries,ipHours)
    if(range){
      const label=range[0]+"-"+range[1]
      const start=minutes(range[0])||0
      draw(label,start<12*60?252:409,y-2,7,false)
    }
  }

  const bytes=await pdf.save()
  return new NextResponse(bytes,{
    headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":`inline; filename="EPC-${year}-${String(month+1).padStart(2,"0")}.pdf"`,
      "Cache-Control":"no-store, max-age=0"
    }
  })
}
