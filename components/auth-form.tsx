"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/components/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const { t } = useI18n()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? t.somethingWrong)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="relative min-h-svh bg-background flex flex-col">
      {/* Left brand panel on large screens */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-card p-12 border-r border-border">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-px w-full bg-foreground" style={{ marginBottom: 14 }} />
              ))}
            </div>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-serif text-xl font-semibold">
              W
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold text-foreground">{t.appName}</p>
              <p className="text-xs text-muted-foreground">{t.orchestra}</p>
            </div>
          </div>
          <div className="relative max-w-md">
            <h2 className="text-balance font-serif text-4xl font-semibold leading-tight text-foreground">
              {t.orchestra}
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
              {t.timesheetSubtitle}. {t.seasonSubtitle}.
            </p>
          </div>
          <p className="relative text-xs text-muted-foreground">Sezóna 2026 / 2027</p>
        </aside>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-serif text-lg font-semibold">
                  W
                </div>
                <span className="font-serif text-base font-semibold text-foreground">{t.appName}</span>
              </div>
              <LanguageToggle className="ml-auto" />
            </div>

            <div className="mb-6">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                {isSignUp ? t.createAccount : t.welcomeBack}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{isSignUp ? t.signUpSubtitle : t.signInSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">{t.name}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="mt-1 w-full">
                {loading ? t.pleaseWait : isSignUp ? t.createAccount : t.signIn}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? t.haveAccount + " " : t.noAccount + " "}
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {isSignUp ? t.signIn : t.signUp}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
