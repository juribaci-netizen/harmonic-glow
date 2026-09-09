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
  return m?Number(m[1])*60+Number(m[2]):null
}
function hhmm(m:number){
  const safe=Math.max(0,Math.min(24*60,Math.round(m)))
  return String(Math.floor(safe/60)).padStart(2,"0")+":"+String(safe%60).padStart(2,"0")
}
function ipRange(entries:any[],hours:number){
  if(hours<=0)return null
  const work=entries.filter(e=>e.type!=="individual"&&e.type!=="ip")
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
  const entries=await getMonthEntries(year,month)

  const cutoff=year<now.getFullYear()||(year===now.getFullYear()&&month<now.getMonth())
    ? new Date(year,month+1,0,23,59,59)
    : year===now.getFullYear()&&month===now.getMonth()?now:new Date(year,month,0)
  const visible=entries.filter(e=>new Date(e.date+"T23:59:59")<=cutoff&&e.status!=="suggested")

  const bg=await readFile(path.join(process.cwd(),"public","epc-template-bg.jpg"))
  const pdf=await PDFDocument.create()
  const page=pdf.addPage([595.32,841.92])
  const image=await pdf.embedJpg(bg)
  page.drawImage(image,{x:0,y:0,width:595.32,height:841.92})

  const form=pdf.getForm()
  const font=await pdf.embedFont(StandardFonts.Helvetica)
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold)
  const fieldColor=rgb(0,0,0)

  const textField=(name:string,value:string,x:number,y:number,w:number,h:number,size=8)=>{
    const f=form.createTextField(name)
    f.setText(value)
    f.setFontSize(size)
    f.addToPage(page,{x,y,width:w,height:h,borderWidth:0,backgroundColor:undefined,textColor:fieldColor})
  }
  const check=(name:string,x:number,y:number,w=18,h=13)=>{
    const f=form.createCheckBox(name)
    f.addToPage(page,{x,y,width:w,height:h,borderWidth:0})
    f.check()
  }

  textField("Mesiac",monthNames[month],188,787,92,15,9)
  textField("Rok",String(year),296,787,55,15,9)
  textField("Meno",user.name||"Marek Juráň",151,755,180,15,8)
  check("Orchester",357,752,18,14)

  const byDay=new Map<number,any[]>()
  for(const e of visible){
    const day=Number(String(e.date).slice(-2))
    byDay.set(day,[...(byDay.get(day)||[]),e])
  }

  for(const [day,dayEntries] of byDay){
    const y=681.6-(day-1)*17.52
    const work=dayEntries.filter(e=>e.type!=="individual"&&e.type!=="ip")
    if(work.length>=1) check(`Check Box ${day}.1`,109,y,20,14)
    if(work.length>=2) check(`Check Box ${day}.2`,154,y,20,14)

    const ipHours=dayEntries.filter(e=>e.type==="individual"||e.type==="ip").reduce((s,e)=>s+Number(e.hours),0)
    const range=ipRange(dayEntries,ipHours)
    if(range){
      const label=range[0]+"-"+range[1]
      const start=minutes(range[0])||0
      const morning=start<12*60
      textField(`Dropdown ${day}.${morning?1:2}`,label,morning?205:365,y,105,14,7)
    }
  }

  form.updateFieldAppearances(font)
  const bytes=await pdf.save()
  return new NextResponse(new Uint8Array(bytes),{
    headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":`inline; filename="EPC-${year}-${String(month+1).padStart(2,"0")}.pdf"`,
      "Cache-Control":"no-store, max-age=0"
    }
  })
}
