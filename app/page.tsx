import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { AppShell } from "@/components/app-shell"
import { DashboardView } from "@/components/dashboard-view"
import { getActivities } from "@/app/actions/schedule"
import { getTimeEntries } from "@/app/actions/time-entries"

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  const [activities, entries] = await Promise.all([getActivities(), getTimeEntries()])

  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = activities.filter((a) => a.date >= todayStr && a.type !== "off").slice(0, 6)

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const inMonth = (d: string) => {
    const dt = new Date(d + "T00:00:00")
    return dt.getFullYear() === y && dt.getMonth() === m
  }
  const monthHours = entries.filter((e) => inMonth(e.date)).reduce((sum, e) => sum + Number(e.hours), 0)
  const monthActivityCount = activities.filter((a) => inMonth(a.date) && a.type !== "off").length

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      <DashboardView
        name={user.name}
        upcoming={upcoming}
        recentEntries={entries.slice(0, 6)}
        monthHours={monthHours}
        monthActivityCount={monthActivityCount}
      />
    </AppShell>
  )
}
