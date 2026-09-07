import { AppShell } from "@/components/app-shell"
import { ScheduleView } from "@/components/schedule-view"
import { seasonData } from "@/lib/season-data-2026-27"
import { getSessionUser } from "@/lib/session"

export default async function SchedulePage() {
  const user = await getSessionUser()

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
    notes: a.notes ?? null,
  }))

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      <ScheduleView activities={activities} />
    </AppShell>
  )
}
