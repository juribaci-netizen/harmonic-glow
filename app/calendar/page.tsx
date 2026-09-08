"use client"

import { AppShell } from "@/components/app-shell"
import { CalendarView } from "@/components/calendar-view"
import { seasonData } from "@/lib/season-data-2026-27"

const activities = seasonData.map((activity, index) => ({ ...activity, id: index + 1 }))

export default function CalendarPage() {
  return (
    <AppShell user={{ name: "", email: "" }}>
      <CalendarView activities={activities} />
    </AppShell>
  )
}
