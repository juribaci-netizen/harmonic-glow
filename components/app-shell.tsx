"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/components/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, CalendarDays, ClipboardList, Video, User, Menu, X, Plus } from "lucide-react"

const navItems = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/schedule", key: "schedule", icon: CalendarDays },
  { href: "/timesheet", key: "timesheet", icon: ClipboardList },
  { href: "/videos", key: "videos", icon: Video },
  { href: "/profile", key: "profile", icon: User },
] as const

export function AppShell({ children, user }: { children: ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname(); const { t } = useI18n(); const [mobileOpen,setMobileOpen]=useState(false)
  const initials=user.name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase()
  const NavLinks=()=> <nav className="flex flex-col gap-1">{navItems.map(item=>{const active=pathname===item.href;const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",active?"bg-sidebar-accent text-sidebar-accent-foreground":"text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}><Icon className="h-4 w-4 shrink-0"/>{t[item.key]}</Link>})}</nav>
  return <div className="min-h-svh bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex"><div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-serif text-lg font-semibold text-primary-foreground">W</div><div className="leading-tight"><p className="font-serif text-base font-semibold">{t.appName}</p><p className="text-xs opacity-60">{t.orchestra}</p></div></div><div className="flex-1 overflow-y-auto px-3 py-4"><NavLinks/></div><div className="border-t border-sidebar-border p-3"><div className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials||"?"}</div><div className="min-w-0 flex-1 leading-tight"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs opacity-60">{user.email}</p></div></div><LanguageToggle/></div></aside>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-serif font-semibold text-primary-foreground">W</div><span className="font-serif text-lg font-semibold">{t.appName}</span></div><Button variant="ghost" size="icon" className="rounded-full" onClick={()=>setMobileOpen(o=>!o)}>{mobileOpen?<X/>:<Menu/>}</Button></header>
    {mobileOpen&&<div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={()=>setMobileOpen(false)}/><div className="absolute inset-y-0 left-0 flex w-[82vw] max-w-80 flex-col bg-sidebar px-4 pt-20 shadow-2xl"><NavLinks/><div className="mt-auto border-t border-sidebar-border py-4"><div className="mb-3 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs opacity-60">{user.email}</p></div></div><LanguageToggle/></div></div></div>}
    <main className="pb-24 lg:pl-64 lg:pb-0"><div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">{children}</div></main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid h-[72px] grid-cols-5 border-t border-border bg-background/95 px-1 pb-safe backdrop-blur lg:hidden">{navItems.map(item=>{const active=pathname===item.href;const Icon=item.icon;return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium",active?"text-primary":"text-muted-foreground")}><Icon className="h-5 w-5"/><span>{t[item.key]}</span></Link>})}</nav>
    <Link href="/timesheet" className="fixed bottom-[88px] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden" aria-label={t.logHours}><Plus className="h-6 w-6"/></Link>
  </div>
}
