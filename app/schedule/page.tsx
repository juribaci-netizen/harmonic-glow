import { AppShell } from "@/components/app-shell"
import { ScheduleView } from "@/components/schedule-view"
import { getActivities } from "@/app/actions/schedule"
import { getSessionUser } from "@/lib/session"

export default async function SchedulePage() {
  const user = await getSessionUser()
  const activities = await getActivities()

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      <ScheduleView activities={activities} />
    </AppShell>
  )
}
