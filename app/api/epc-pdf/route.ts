import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { getMonthEntries } from "@/app/actions/time-entries"
import { getSessionUser } from "@/lib/session"

const monthNames=["Januar","Februar","Marec","April","Maj","Jun","Jul","August","September","Oktober","November","December"]

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
  const dur=Math.max(30,Math.round(hours*60))
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
function safeText(value:string){
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E]/g,"").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")
}
function textCmd(text:string,x:number,y:number,size:number,bold=false){
  return `BT /${bold?"F2":"F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${safeText(text)}) Tj ET\n`
}
function buildPdf(jpg:Buffer,content:string){
  const objects:Buffer[]=[]
  const add=(body:Buffer|string)=>objects.push(Buffer.isBuffer(body)?body:Buffer.from(body,"binary"))
  add("<< /Type /Catalog /Pages 2 0 R >>")
  add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
  add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.32 841.92] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>")
  add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 596 /Height 842 /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`,"binary"),jpg,Buffer.from("\nendstream","binary")]))
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
  const stream=Buffer.from(content,"binary")
  add(Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`,"binary"),stream,Buffer.from("\nendstream","binary")]))

  const chunks=[Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n","binary")]
  const offsets=[0]
  let pos=chunks[0].length
  objects.forEach((obj,i)=>{
    offsets.push(pos)
    const head=Buffer.from(`${i+1} 0 obj\n`,"binary")
    const tail=Buffer.from("\nendobj\n","binary")
    chunks.push(head,obj,tail)
    pos+=head.length+obj.length+tail.length
  })
  const xrefPos=pos
  let xref=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`
  for(let i=1;i<=objects.length;i++)xref+=String(offsets[i]).padStart(10,"0")+" 00000 n \n"
  xref+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`
  chunks.push(Buffer.from(xref,"binary"))
  return Buffer.concat(chunks)
}

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
  const jpg=await readFile(path.join(process.cwd(),"public","epc-template-bg.jpg"))

  let commands="q 595.32 0 0 841.92 0 0 cm /Im0 Do Q\n"
  commands+=textCmd(monthNames[month],202,794,9,true)
  commands+=textCmd(String(year),307,794,9,true)
  commands+=textCmd(user.name||user.email,170,764,8,false)
  commands+=textCmd("X",369,757,10,true)

  const byDay=new Map<number,any[]>()
  for(const e of visible){
    const day=Number(String(e.date).slice(-2))
    byDay.set(day,[...(byDay.get(day)||[]),e])
  }

  for(const [day,dayEntries] of byDay){
    const y=rowY(day)
    const work=dayEntries.filter(e=>e.type!=="individual"&&e.type!=="ip")
    if(work.length>=1)commands+=textCmd("X",119,y-3,10,true)
    if(work.length>=2)commands+=textCmd("X",165,y-3,10,true)
    const ipHours=dayEntries.filter(e=>e.type==="individual"||e.type==="ip").reduce((s,e)=>s+Number(e.hours),0)
    const range=ipRange(dayEntries,ipHours)
    if(range){
      const label=range[0]+"-"+range[1]
      const start=minutes(range[0])||0
      commands+=textCmd(label,start<12*60?252:409,y-2,7,false)
    }
  }

  const pdf=buildPdf(jpg,commands)
  return new NextResponse(pdf,{
    headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":`inline; filename="EPC-${year}-${String(month+1).padStart(2,"0")}.pdf"`,
      "Cache-Control":"no-store, max-age=0"
    }
  })
}
