import { AppShell } from "@/components/app-shell"
import { DashboardView } from "@/components/dashboard-view"
import { seasonData } from "@/lib/season-data-2026-27"

const activities = seasonData.map((a, index) => ({
  id: index + 1,
  date: a.date,
  type: a.type,
  startTime: a.startTime,
  endTime: a.endTime,
  title: a.title,
  conductor: a.conductor,
  venue: a.venue,
  program: a.program,
  notes: a.notes,
}))

export default async function DashboardPage() {
  const now = new Date()
  const localIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return y + "-" + m + "-" + day
  }
  const todayStr = localIso(now)
  const end = new Date(now)
  end.setDate(end.getDate() + 6)
  const endStr = localIso(end)

  const weekActivities = activities.filter(a => a.date >= todayStr && a.date <= endStr)
  const upcoming = activities.filter(a => a.date >= todayStr && a.type !== "off").slice(0, 8)
  const today = activities.filter(a => a.date === todayStr)

  return (
    <AppShell user={{ name: "", email: "" }}>
      <DashboardView
        name=""
        activities={activities}
        today={today}
        upcoming={upcoming}
        weekActivities={weekActivities}
        recentEntries={[]}
        monthHours={0}
        monthActivityCount={0}
        monthConcertCount={0}
        todayHours={0}
      />
    </AppShell>
  )
}
