import { AppShell } from "@/components/app-shell"
import { ScheduleView } from "@/components/schedule-view"
import { getActivities, seedSeason } from "@/app/actions/schedule"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function SchedulePage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  const activities = await getActivities()
  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      <ScheduleView activities={activities} seedSeason={seedSeason} />
    </AppShell>
  )
}
