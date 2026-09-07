"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { LayoutGrid, CalendarDays, ClipboardCheck, PlaySquare, UserRound, Music2 } from "lucide-react"

const navItems = [
  { href: "/", key: "dashboard", icon: LayoutGrid },
  { href: "/schedule", key: "schedule", icon: CalendarDays },
  { href: "/timesheet", key: "timesheet", icon: ClipboardCheck },
  { href: "/videos", key: "videos", icon: PlaySquare },
  { href: "/profile", key: "profile", icon: UserRound },
] as const

export function AppShell({ children }: { children: ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="min-h-svh">
      <div className="mx-auto min-h-svh w-full max-w-[430px] bg-[#f2f2f7] shadow-[0_0_60px_rgba(0,0,0,.08)] sm:my-5 sm:min-h-[calc(100svh-40px)] sm:overflow-hidden sm:rounded-[36px] sm:ring-1 sm:ring-black/[.06]">
        <header className="sticky top-0 z-30 border-b border-black/[.05] bg-[#f2f2f7]/88 backdrop-blur-2xl">
          <div className="flex h-[62px] items-center justify-between px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-black text-white shadow-sm">
                <Music2 className="h-[17px] w-[17px]"/>
              </div>
              <div>
                <p className="text-[15px] font-bold leading-none tracking-[-.02em]">{t.appName}</p>
                <p className="mt-1 text-[9px] font-medium uppercase tracking-[.13em] text-black/40">Slovenská filharmónia</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#d8d8dc] to-[#f7f7f8] ring-1 ring-black/[.06]"/>
          </div>
        </header>

        <main className="pb-[104px]">
          <div className="px-4 py-4">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-black/[.07] bg-[#f9f9fb]/88 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:bottom-5 sm:rounded-b-[36px]">
          <div className="grid h-[72px] grid-cols-5 px-2">
            {navItems.map(item=>{
              const active=pathname===item.href
              const Icon=item.icon
              return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 text-[9px] font-semibold",active?"text-[#0a84ff]":"text-black/38")}>
                <Icon className="h-[21px] w-[21px]" strokeWidth={active?2.4:1.9}/>
                <span>{t[item.key]}</span>
              </Link>
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
