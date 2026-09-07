"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/components/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { cn } from "@/lib/utils"
import { LayoutDashboard, CalendarDays, ClipboardList, Video, User, Music2 } from "lucide-react"

const navItems = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/schedule", key: "schedule", icon: CalendarDays },
  { href: "/timesheet", key: "timesheet", icon: ClipboardList },
  { href: "/videos", key: "videos", icon: Video },
  { href: "/profile", key: "profile", icon: User },
] as const

export function AppShell({ children, user }: { children: ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname()
  const { t } = useI18n()
  const initials = user.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()

  return <div className="min-h-svh bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-[#111] text-white lg:flex">
      <div className="px-6 pb-5 pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <Music2 className="h-5 w-5 text-[#d7b56d]"/>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold tracking-tight">{t.appName}</p>
            <p className="text-[10px] uppercase tracking-[.22em] text-white/45">Slovenská filharmónia</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-3">
        {navItems.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return <Link key={item.href} href={item.href}
            className={cn("mb-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition",
              active ? "bg-[#d7b56d] font-semibold text-[#111]" : "text-white/65 hover:bg-white/5 hover:text-white")}>
            <Icon className="h-[18px] w-[18px]"/>{t[item.key]}
          </Link>
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-black">{initials}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[10px] text-white/45">{user.email}</p>
            </div>
          </div>
          <LanguageToggle className="border-white/10 bg-white/5"/>
        </div>
      </div>
    </aside>

    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f4f1ea]/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-[66px] max-w-[560px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-[#d7b56d]"><Music2 className="h-[18px] w-[18px]"/></div>
          <div>
            <p className="font-serif text-[18px] font-semibold leading-none">{t.appName}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[.17em] text-muted-foreground">Slovenská filharmónia</p>
          </div>
        </div>
        <LanguageToggle />
      </div>
    </header>

    <main className="pb-28 lg:pl-72 lg:pb-0">
      <div className="mx-auto w-full max-w-[560px] px-4 py-5 sm:px-6 lg:max-w-6xl lg:px-12 lg:py-10">{children}</div>
    </main>

    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2 rounded-[24px] border border-white/10 bg-[#111]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-xl lg:hidden">
      <div className="grid h-[70px] grid-cols-5 items-center">
        {navItems.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return <Link key={item.href} href={item.href}
            className={cn("flex h-full flex-col items-center justify-center gap-1 text-[9px] font-medium transition",
              active ? "text-[#d7b56d]" : "text-white/45")}>
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full",active&&"bg-white/10")}><Icon className="h-[18px] w-[18px]"/></span>
            <span>{t[item.key]}</span>
          </Link>
        })}
      </div>
    </nav>
  </div>
}
