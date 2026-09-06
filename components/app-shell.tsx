"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/components/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { cn } from "@/lib/utils"
import { LayoutDashboard, CalendarDays, ClipboardList, Video, User, Music2, Plus } from "lucide-react"

const navItems = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/schedule", key: "schedule", icon: CalendarDays },
  { href: "/timesheet", key: "timesheet", icon: ClipboardList },
  { href: "/videos", key: "videos", icon: Video },
  { href: "/profile", key: "profile", icon: User },
] as const

export function AppShell({ children, user }: { children: ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname(); const { t } = useI18n()
  const initials = user.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
  return <div className="min-h-svh bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Music2 className="h-5 w-5"/></div><div className="leading-tight"><p className="font-serif text-base font-semibold">{t.appName}</p><p className="text-xs opacity-60">{t.orchestra} · {t.practice} · {t.concerts}</p></div></div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">{navItems.map(item=>{const active=pathname===item.href;const Icon=item.icon;return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",active?"bg-sidebar-accent text-sidebar-accent-foreground":"text-sidebar-foreground/70 hover:bg-sidebar-accent/50") }><Icon className="h-4 w-4"/>{t[item.key]}</Link>})}</nav>
      <div className="border-t border-sidebar-border p-3"><div className="mb-3 flex items-center gap-3 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs opacity-60">{user.email}</p></div></div><LanguageToggle/></div>
    </aside>

    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex h-[68px] max-w-[520px] items-center gap-3 px-5"><div className="flex h-9 w-9 items-center justify-center text-foreground"><Music2 className="h-7 w-7"/></div><div className="leading-tight"><p className="font-serif text-lg font-semibold">{t.appName}</p><p className="text-[10px] text-muted-foreground">{t.orchestra} · {t.practice} · {t.concerts}</p></div></div>
    </header>

    <main className="pb-24 lg:pl-64 lg:pb-0"><div className="mx-auto w-full max-w-[520px] px-4 py-5 sm:px-6 lg:max-w-6xl lg:px-10 lg:py-10">{children}</div></main>

    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[76px] border-t border-border bg-background/98 px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"><div className="mx-auto grid h-full max-w-[520px] grid-cols-5 items-center">
      {navItems.slice(0,2).map(item=>{const active=pathname===item.href;const Icon=item.icon;return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium",active?"text-primary":"text-muted-foreground")}><Icon className="h-[19px] w-[19px]"/><span>{t[item.key]}</span></Link>})}
      <Link href="/timesheet" className="mx-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-foreground text-background shadow-lg"><Plus className="h-6 w-6"/></Link>
      {navItems.slice(2).map(item=>{const active=pathname===item.href;const Icon=item.icon;return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium",active?"text-primary":"text-muted-foreground")}><Icon className="h-[19px] w-[19px]"/><span>{t[item.key]}</span></Link>})}
    </div></nav>
  </div>
}
