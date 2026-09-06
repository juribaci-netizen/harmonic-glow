import { AppShell } from "@/components/app-shell"
import { TimesheetView } from "@/components/timesheet-view"
import { getMonthEntries } from "@/app/actions/time-entries"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function TimesheetPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  const now = new Date()
  const entries = await getMonthEntries(now.getFullYear(), now.getMonth())
  return <AppShell user={{ name: user.name, email: user.email }}><TimesheetView initialEntries={entries} year={now.getFullYear()} month={now.getMonth()} /></AppShell>
}
