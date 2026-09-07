"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { translations, type Lang } from "@/lib/i18n/translations"

type Dict = (typeof translations)["en"]

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Dict
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sk")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("worktime-lang") as Lang | null) : null
    if (stored === "sk" || stored === "en" || stored === "de") setLangState(stored)
  }, [])

  const setLang = (next: Lang) => {
    setLangState(next)
    if (typeof window !== "undefined") localStorage.setItem("worktime-lang", next)
    document.documentElement.lang = next
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>{children}</LanguageContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider")
  return ctx
}
