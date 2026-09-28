import { readPreparationPreferences } from '@/lib/epc/preparation-preferences-store'
import { submissionIssues } from '@/lib/epc/submission-validation'
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
  const {shortfalls,weeklyTotals}=await autoFillMonthFromWorkPlan(year,month)
  const [entries,report,profile,preparationPreferences]=await Promise.all([getMonthEntries(year,month),readReport(user.id,year,month),getProfile(),readPreparationPreferences(user.id)])
  const data={entries,shortfalls,weeklyTotals,preparationPreferences,...report,fullName:profile?.fullName??user.name}
  return NextResponse.json({...data,submissionIssues:submissionIssues(data,year,month)},{headers:{'Cache-Control':'no-store'}})
}
