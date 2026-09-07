"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { House, CalendarDays, ClipboardCheck, Play, UserRound } from "lucide-react"

const navItems = [
  { href: "/", key: "dashboard", icon: House },
  { href: "/schedule", key: "schedule", icon: CalendarDays },
  { href: "/timesheet", key: "timesheet", icon: ClipboardCheck },
  { href: "/videos", key: "videos", icon: Play },
  { href: "/profile", key: "profile", icon: UserRound },
] as const

export function AppShell({ children }: { children: ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="min-h-svh bg-[#f7f7f8]">
      <div className="mx-auto min-h-svh w-full max-w-[460px]">
        <header className="sticky top-0 z-30 bg-[#f7f7f8]/82 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
          <div className="flex h-14 items-center justify-between px-5">
            <p className="text-[15px] font-semibold tracking-[-.02em]">Worktime</p>
            <p className="text-[10px] font-medium tracking-[.02em] text-black/35">SF</p>
          </div>
        </header>

        <main className="pb-[98px]">
          <div className="px-5 pb-6 pt-2">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[460px] -translate-x-1/2 border-t border-black/[.06] bg-white/82 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl">
          <div className="grid h-[64px] grid-cols-5 px-3">
            {navItems.map(item=>{
              const active=pathname===item.href
              const Icon=item.icon
              return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 text-[9px] font-medium",active?"text-black":"text-black/32")}>
                <Icon className="h-[20px] w-[20px]" strokeWidth={active?2.35:1.8}/>
                <span>{t[item.key]}</span>
              </Link>
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
