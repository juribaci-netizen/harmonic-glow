import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getMonthEntries, autoFillMonthFromWorkPlan } from '@/app/actions/time-entries'
import { getSessionUser } from '@/lib/session'
import { getProfile } from '@/app/actions/profile'
import { readReport } from '@/lib/epc/report-store'
import { createEpcPdf } from '@/lib/epc/pdf'
import { validateMonth, bratislavaNow } from '@/lib/epc/model'

export async function GET(request:Request) {
  const user=await getSessionUser()
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const params=new URL(request.url).searchParams,now=bratislavaNow()
  const year=Number(params.get('year')??now.date.slice(0,4)),month=Number(params.get('month')??Number(now.date.slice(5,7))-1)
  try{validateMonth(year,month)}catch{return NextResponse.json({error:'Neplatný mesiac.'},{status:400})}
  await autoFillMonthFromWorkPlan(year,month)
  const [entries,report,profile,template,fontBytes]=await Promise.all([
    getMonthEntries(year,month),readReport(user.id,year,month),getProfile(),
    readFile(path.join(process.cwd(),'public','epc-blank.pdf')),
    readFile(path.join(process.cwd(),'public','fonts','EpcSans.ttf')),
  ])
  const bytes=await createEpcPdf({template,fontBytes,year,month,name:profile?.fullName??user.name,entries,...report})
  return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="EPC-${year}-${String(month+1).padStart(2,'0')}.pdf"`,'Cache-Control':'no-store, max-age=0'}})
}
