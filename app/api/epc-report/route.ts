import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'
import { getMonthEntries,autoFillMonthFromWorkPlan } from '@/app/actions/time-entries'
import { readReport } from '@/lib/epc/report-store'
import { validateMonth } from '@/lib/epc/model'
import { getProfile } from '@/app/actions/profile'
export async function GET(request:Request) {
  const user=await getSessionUser()
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const params=new URL(request.url).searchParams
  const year=Number(params.get('year')),month=Number(params.get('month'))
  try{validateMonth(year,month)}catch{return NextResponse.json({error:'Neplatný mesiac.'},{status:400})}
  const {shortfalls}=await autoFillMonthFromWorkPlan(year,month)
  const [entries,report,profile]=await Promise.all([getMonthEntries(year,month),readReport(user.id,year,month),getProfile()])
  return NextResponse.json({entries,shortfalls,...report,fullName:profile?.fullName??user.name},{headers:{'Cache-Control':'no-store'}})
}
