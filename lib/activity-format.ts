import type { TranslationKey } from "@/lib/i18n/translations"

export type ActivityType = "rehearsal" | "concert" | "recording" | "dress" | "off" | "ip" | "other"

export const activityTypeKey: Record<string, TranslationKey> = {
  rehearsal: "type_rehearsal",
  concert: "type_concert",
  recording: "type_recording",
  dress: "type_dress",
  off: "type_off",
  ip: "type_ip",
  other: "type_other",
}

export const statusKey: Record<string, TranslationKey> = {
  present: "status_present",
  absent: "status_absent",
  excused: "status_excused",
}

// Tailwind classes per activity type (uses theme tokens / chart colors)
export const typeStyles: Record<string, { dot: string; badge: string }> = {
  concert: { dot: "bg-primary", badge: "border-primary/40 bg-primary/10 text-primary" },
  rehearsal: { dot: "bg-chart-2", badge: "border-chart-2/40 bg-chart-2/10 text-chart-2" },
  recording: { dot: "bg-chart-4", badge: "border-chart-4/40 bg-chart-4/10 text-chart-4" },
  dress: { dot: "bg-chart-3", badge: "border-chart-3/40 bg-chart-3/10 text-chart-3" },
  ip: { dot: "bg-chart-5", badge: "border-chart-5/40 bg-chart-5/10 text-chart-5" },
  off: { dot: "bg-muted-foreground", badge: "border-border bg-muted text-muted-foreground" },
  other: { dot: "bg-muted-foreground", badge: "border-border bg-muted text-muted-foreground" },
}

export function diffHours(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0
}
