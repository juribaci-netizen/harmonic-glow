import { AppShell } from '@/components/app-shell'
import { TimesheetView } from '@/components/timesheet-view'
import { getMonthEntries } from '@/app/actions/time-entries'
import { getSessionUser } from '@/lib/session'
import { getProfile } from '@/app/actions/profile'
import { bratislavaNow, validateMonth } from '@/lib/epc/model'
import { notFound } from 'next/navigation'

export default async function EpcPdfEditorPage({ searchParams }: { searchParams: Promise<{year?:string;month?:string}> }) {
  const params = await searchParams
  const now = bratislavaNow()
  const year = Number(params.year ?? now.date.slice(0,4))
  const month = Number(params.month ?? Number(now.date.slice(5,7))-1)
  try { validateMonth(year,month) } catch { notFound() }
  const user = await getSessionUser()
  const [entries,profile] = await Promise.all([getMonthEntries(year,month),getProfile()])
  return <AppShell user={user}><TimesheetView pdfEditor initialEntries={entries} year={year} month={month} userId={user.id} fullName={profile?.fullName??user.name}/></AppShell>
}
