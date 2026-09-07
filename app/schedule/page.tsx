"use client"

import { AppShell } from "@/components/app-shell"
import { ScheduleView } from "@/components/schedule-view"
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
  notes: a.notes ?? null,
}))

export default function SchedulePage() {
  return (
    <AppShell user={{ name: "Marek Juran", email: "juribaci@gmail.com" }}>
      <ScheduleView activities={activities} />
    </AppShell>
  )
}
