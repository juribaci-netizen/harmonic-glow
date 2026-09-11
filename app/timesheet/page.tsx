import { AppShell } from '@/components/app-shell'
import { TimesheetView } from '@/components/timesheet-view'
import { getMonthEntries } from '@/app/actions/time-entries'
import { getSessionUser } from '@/lib/session'
import { getProfile } from '@/app/actions/profile'
import { bratislavaNow } from '@/lib/epc/model'
import { redirect } from 'next/navigation'
export default async function TimesheetPage() {
  const user=await getSessionUser()
  if(!user)redirect('/sign-in')
  const now=bratislavaNow(),year=Number(now.date.slice(0,4)),month=Number(now.date.slice(5,7))-1
  const [entries,profile]=await Promise.all([getMonthEntries(year,month),getProfile()])
  return <AppShell user={user}><TimesheetView initialEntries={entries} year={year} month={month} userId={user.id} fullName={profile?.fullName??user.name}/></AppShell>
}
