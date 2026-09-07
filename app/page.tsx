import { getSessionUser } from "@/lib/session"
import { AppShell } from "@/components/app-shell"
import { DashboardView } from "@/components/dashboard-view"
import { getActivities } from "@/app/actions/schedule"
import { getTimeEntries } from "@/app/actions/time-entries"

export default async function DashboardPage() {
  const user = await getSessionUser()
  const [activities, entries] = await Promise.all([getActivities(), getTimeEntries()])

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const start = new Date(now)
  start.setHours(0,0,0,0)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23,59,59,999)

  const weekActivities = activities.filter((a) => {
    const d = new Date(a.date + "T00:00:00")
    return d >= start && d <= end
  })

  const upcoming = activities.filter((a) => a.date >= todayStr && a.type !== "off").slice(0, 8)
  const today = activities.filter((a) => a.date === todayStr)

  const y = now.getFullYear()
  const m = now.getMonth()
  const inMonth = (d: string) => {
    const dt = new Date(d + "T00:00:00")
    return dt.getFullYear() === y && dt.getMonth() === m
  }

  const monthEntries = entries.filter(e => inMonth(e.date))
  const monthHours = monthEntries.reduce((sum, e) => sum + Number(e.hours), 0)
  const todayHours = entries.filter(e => e.date === todayStr).reduce((sum, e) => sum + Number(e.hours), 0)
  const monthActivities = activities.filter(a => inMonth(a.date) && a.type !== "off")
  const monthConcertCount = monthActivities.filter(a => a.type === "concert").length

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      <DashboardView
        name={user.name}
        today={today}
        upcoming={upcoming}
        weekActivities={weekActivities}
        recentEntries={entries.slice(0, 4)}
        monthHours={monthHours}
        monthActivityCount={monthActivities.length}
        monthConcertCount={monthConcertCount}
        todayHours={todayHours}
      />
    </AppShell>
  )
}
