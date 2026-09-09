import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { autoFillMonthFromWorkPlan, getMonthEntries } from "@/app/actions/time-entries"
import { getSessionUser } from "@/lib/session"

const monthNames=["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"]
const serviceTypes=new Set(["rehearsal","general","concert","recording"])

function minutes(time:string|null|undefined){
  if(!time)return null
  const m=time.match(/^(\d{1,2}):(\d{2})$/)
  return m?Number(m[1])*60+Number(m[2]):null
}
function hhmm(m:number){
  const safe=Math.max(0,Math.min(24*60,Math.round(m)))
  return String(Math.floor(safe/60)).padStart(2,"0")+":"+String(safe%60).padStart(2,"0")
}
function bratislavaNow(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Bratislava",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date())
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]))
  return {date:`${p.year}-${p.month}-${p.day}`,minutes:Number(p.hour)*60+Number(p.minute)}
}
function visibleNow(entry:any,today:string,nowMinutes:number){
  if(entry.date<today)return true
  if(entry.date>today)return false
  const end=minutes(entry.endTime)
  if(end!==null)return end<=nowMinutes
  const start=minutes(entry.startTime)
  if(start!==null)return start<=nowMinutes
  return true
}
function ipRange(entries:any[],hours:number){
  if(hours<=0)return null
  const work=entries.filter(e=>serviceTypes.has(e.type))
  const starts=work.map(e=>minutes(e.startTime)).filter((x):x is number=>x!==null)
  const ends=work.map(e=>minutes(e.endTime)).filter((x):x is number=>x!==null)
  const dur=Math.max(30,Math.round(hours*60))
  let start=10*60
  if(starts.length&&Math.min(...starts)>=14*60) start=Math.max(8*60,Math.min(...starts)-dur-60)
  else if(ends.length) start=Math.max(14*60,Math.max(...ends)+60)
  if(start+dur>22*60) start=Math.max(8*60,22*60-dur)
  return [hhmm(start),hhmm(start+dur)] as const
}

export async function GET(request:Request){
  const user=await getSessionUser()
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})

  const {searchParams}=new URL(request.url)
  const now=new Date()
  const year=Number(searchParams.get("year"))||now.getFullYear()
  const monthRaw=Number(searchParams.get("month"))
  const month=Number.isInteger(monthRaw)&&monthRaw>=0&&monthRaw<=11?monthRaw:now.getMonth()

  await autoFillMonthFromWorkPlan(year,month)
  const entries=await getMonthEntries(year,month)
  const local=bratislavaNow()
  const selectedPrefix=`${year}-${String(month+1).padStart(2,"0")}-`
  const isPastMonth=selectedPrefix<local.date.slice(0,8)
  const isFutureMonth=selectedPrefix>local.date.slice(0,8)
  const visible=isPastMonth?entries:isFutureMonth?[]:entries.filter(e=>visibleNow(e,local.date,local.minutes))

  const bg=await readFile(path.join(process.cwd(),"public","epc-template-bg.jpg"))
  const pdf=await PDFDocument.create()
  const page=pdf.addPage([595.32,841.92])
  const image=await pdf.embedJpg(bg)
  page.drawImage(image,{x:0,y:0,width:595.32,height:841.92})

  const form=pdf.getForm()
  const font=await pdf.embedFont(StandardFonts.Helvetica)
  const black=rgb(0,0,0)

  const textField=(name:string,value:string,x:number,y:number,w:number,h:number,size=10,align:"left"|"center"="left")=>{
    const field=form.createTextField(name)
    field.setText(value)
    field.setFontSize(size)
    if(align==="center") field.setAlignment(1)
    field.addToPage(page,{x,y,width:w,height:h,borderWidth:0,textColor:black})
  }
  const xField=(name:string,x:number,y:number,w:number,h:number)=>{
    textField(name,"X",x,y,w,h,12,"center")
  }

  // Exact original EPČ field rectangles.
  textField("Mesiac",monthNames[month],195.065,788.3,73.6,17.922,10)
  textField("Rok",String(year),300.221,788.3,46.546,17.922,10)
  textField("Meno",user.name||"Marek Juráň",167.292,759.774,129.163,17.923,10)

  // Keep the original "Orchester" visual: selected by a clean outline around the label.
  const orchestra=form.createButton("Orchester")
  orchestra.addToPage("Orchester",page,{x:349.806,y:752.49,width:54.892,height:17.643,borderWidth:1,borderColor:black,textColor:black,font,size:9})

  const byDay=new Map<number,any[]>()
  for(const e of visible){
    const day=Number(String(e.date).slice(-2))
    byDay.set(day,[...(byDay.get(day)||[]),e])
  }

  for(const [day,dayEntries] of byDay){
    const rowY=680.502-(day-1)*17.6
    const work=dayEntries.filter(e=>serviceTypes.has(e.type))
    if(work.length>=1) xField(`Check Box ${day}.1`,100.964,rowY,45.528,16.872)
    if(work.length>=2) xField(`Check Box ${day}.2`,147.401,rowY,45.491,16.872)

    const ipHours=dayEntries.filter(e=>e.type==="individual"||e.type==="ip").reduce((s,e)=>s+Number(e.hours),0)
    const range=ipRange(dayEntries,ipHours)
    if(range){
      const label=range[0]+"-"+range[1]
      const start=minutes(range[0])||0
      if(start<12*60) textField(`Dropdown ${day}.1`,label,228.565,rowY,122.181,16.872,9)
      else textField(`Dropdown ${day}.2`,label,386.164,rowY,119.346,16.145,9)
    }
  }

  form.updateFieldAppearances(font)
  const bytes=await pdf.save()
  return new NextResponse(new Uint8Array(bytes),{
    headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":`inline; filename="EPC-${year}-${String(month+1).padStart(2,"0")}.pdf"`,
      "Cache-Control":"no-store, max-age=0, must-revalidate"
    }
  })
}
