import { AppShell } from "@/components/app-shell"
import { TimesheetView } from "@/components/timesheet-view"
import { MonthEnsembleChoice } from "@/components/month-ensemble-choice"
import { EpcDirectEditor } from "@/components/epc-direct-editor"
import { getMonthEntries } from "@/app/actions/time-entries"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function TimesheetPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const entries = await getMonthEntries(year, month)

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      <MonthEnsembleChoice year={year} month={month} />
      <EpcDirectEditor year={year} month={month} />
      <TimesheetView initialEntries={entries} year={year} month={month} />
    </AppShell>
  )
}
