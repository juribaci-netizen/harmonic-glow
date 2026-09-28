"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { House, ClipboardList, ClipboardCheck, Play, UserRound } from "lucide-react"

const languageOptions = [
  { code: "sk", flag: "🇸🇰", label: "Slovenčina" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
] as const

const navItems = [
  { href: "/", key: "dashboard", icon: House },
  { href: "/schedule", key: "schedule", icon: ClipboardList },
  { href: "/timesheet", key: "timesheet", icon: ClipboardCheck },
  { href: "/videos", key: "videos", icon: Play },
  { href: "/profile", key: "profile", icon: UserRound },
] as const

export function AppShell({ children }: { children: ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()
  const isEpc=pathname.startsWith("/timesheet")

  return (
    <div className="min-h-svh bg-[#f6f1e8] text-[#30271e]">
      <div className={cn("mx-auto min-h-svh w-full",isEpc?"max-w-[900px]":"max-w-[460px]")}>
        <main className="pb-[98px] pt-[env(safe-area-inset-top)]">
          <div role="group" aria-label="Language" className="flex justify-end gap-1 px-5 pt-2">
            {languageOptions.map(option => (
              <button key={option.code} type="button" onClick={() => setLang(option.code)}
                aria-label={option.label} title={option.label} aria-pressed={lang === option.code}
                className={cn("flex h-11 w-11 items-center justify-center rounded-full text-[23px] transition-colors hover:bg-[#e9ddca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#78552f]", lang === option.code ? "bg-[#e9ddca] ring-1 ring-[#a8885f]" : "bg-transparent")}>
                <span aria-hidden="true">{option.flag}</span>
              </button>
            ))}
          </div>
          <div className={cn("pb-6 pt-2",isEpc?"px-2 sm:px-5":"px-5")}>{children}</div>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[460px] -translate-x-1/2 border-t border-[#ddceb9] bg-[#fffaf2]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl">
          <div className="grid h-[64px] grid-cols-5 px-3">
            {navItems.map(item=>{
              const active=pathname===item.href
              const Icon=item.icon
              return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={cn("flex flex-col items-center justify-center gap-1 text-[9px] font-medium",active?"text-[#78552f]":"text-[#81705c]")}>
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
