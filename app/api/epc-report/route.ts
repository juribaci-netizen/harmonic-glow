import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'
import { getMonthEntries,autoFillMonthFromWorkPlan } from '@/app/actions/time-entries'
import { readReport } from '@/lib/epc/report-store'
import { validateMonth } from '@/lib/epc/model'
export async function GET(request:Request) {
  const user=await getSessionUser()
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const params=new URL(request.url).searchParams
  const year=Number(params.get('year')),month=Number(params.get('month'))
  try{validateMonth(year,month)}catch{return NextResponse.json({error:'Neplatný mesiac.'},{status:400})}
  await autoFillMonthFromWorkPlan(year,month)
  const [entries,report]=await Promise.all([getMonthEntries(year,month),readReport(user.id,year,month)])
  return NextResponse.json({entries,...report},{headers:{'Cache-Control':'no-store'}})
}
