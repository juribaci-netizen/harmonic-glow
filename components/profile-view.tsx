"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { useI18n } from "@/components/language-provider"
import { saveProfile, type ProfileInput } from "@/app/actions/profile"
import { Check, Globe2, Mail, Music2, Pencil, Phone, X } from "lucide-react"

type Profile = {
  fullName: string | null
  instrument: string | null
  section: string | null
  position: string | null
  phone: string | null
}

export function ProfileView({ user, profile }: { user: { name: string; email: string }; profile: Profile | null }) {
  const { lang, setLang, t } = useI18n()
  const initial: ProfileInput = {
    fullName: profile?.fullName ?? user.name,
    instrument: profile?.instrument ?? "Husle",
    section: profile?.section ?? "Prvé husle",
    position: profile?.position ?? "Prvé husle",
    phone: profile?.phone ?? "",
  }
  const [draft, setDraft] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const cancel = () => {
    setDraft(initial)
    setMessage("")
    setEditing(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      await saveProfile(draft)
      setEditing(false)
      setMessage(t.saved)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.somethingWrong)
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof ProfileInput, value: string) => setDraft(current => ({ ...current, [field]: value }))

  return <div className="space-y-6 text-[#292620]">
    <header className="flex items-center justify-between gap-3 pt-2">
      <h1 className="text-[24px] font-semibold tracking-[-.035em]">{t.profile}</h1>
      {editing ? (
        <button type="button" onClick={cancel} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#8b6f4b]/20 bg-white px-3.5 text-[12px] font-medium text-[#594b3a] disabled:opacity-50">
          <X className="h-4 w-4" />{t.cancel}
        </button>
      ) : (
        <button type="button" onClick={() => { setMessage(""); setEditing(true) }} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#8b6f4b]/20 bg-white px-3.5 text-[12px] font-medium text-[#594b3a]">
          <Pencil className="h-3.5 w-3.5" />{t.edit}
        </button>
      )}
    </header>

    <section className="rounded-[20px] border border-[#8b6f4b]/15 bg-[#faf8f5] px-5 py-6 shadow-[0_2px_8px_rgba(62,48,30,0.025)]">
      <div className="flex items-center gap-4 max-[360px]:flex-col max-[360px]:items-start">
        <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#8b6f4b] text-white"><Music2 className="h-7 w-7" strokeWidth={1.7}/></div>
        <div className="min-w-0"><h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-.035em] [overflow-wrap:anywhere]">{draft.fullName || user.name}</h2><p className="mt-2 text-[13px] leading-relaxed text-[#6b6256]">{draft.instrument || "—"} · {draft.position || draft.section || "—"}</p><p className="mt-1 text-[11px] text-[#766a5c]">{t.orchestra}</p></div>
      </div>
    </section>

    {editing ? (
      <form onSubmit={submit} className="space-y-5">
        <Group title={t.personalData}>
          <Field label={t.fullName} value={draft.fullName} onChange={value => update("fullName", value)} required maxLength={150} />
          <ReadOnlyRow icon={<Mail/>} label={t.email} value={user.email}/>
          <Field label={t.phone} value={draft.phone} onChange={value => update("phone", value)} type="tel" maxLength={40} />
        </Group>
        <Group title={t.orchestraSection}>
          <Field label={t.instrument} value={draft.instrument} onChange={value => update("instrument", value)} maxLength={100} />
          <Field label={t.section} value={draft.section} onChange={value => update("section", value)} maxLength={100} />
          <Field label={t.position} value={draft.position} onChange={value => update("position", value)} maxLength={100} />
        </Group>
        <div className="flex items-center justify-between gap-3">
          <p role="status" aria-live="polite" className="text-[12px] text-[#6b6256]">{message}</p>
          <button type="submit" disabled={saving} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#78552f] px-4 text-[12px] font-semibold text-white hover:bg-[#664523] disabled:cursor-wait disabled:opacity-60">
            <Check className="h-4 w-4" />{saving ? t.saving : t.save}
          </button>
        </div>
      </form>
    ) : (
      <>
        <Group title={t.personalData}>
          <ReadOnlyRow icon={<Mail/>} label={t.email} value={user.email}/>
          <ReadOnlyRow icon={<Phone/>} label={t.phone} value={draft.phone || "—"}/>
        </Group>
        <Group title={t.orchestraSection}>
          <ReadOnlyRow icon={<Music2/>} label={t.instrument} value={draft.instrument || "—"}/>
          <ReadOnlyRow icon={<Music2/>} label={t.section} value={draft.section || "—"}/>
          <ReadOnlyRow icon={<Music2/>} label={t.position} value={draft.position || "—"}/>
        </Group>
      </>
    )}

    <Group title={t.settings}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f3eee7] text-[#806442]"><Globe2 className="h-4 w-4" strokeWidth={1.75}/></span>
        <span className="flex-1 text-[13px] font-medium">{t.language}</span>
        <div role="group" aria-label={t.language} className="inline-flex rounded-full border border-[#8b6f4b]/15 bg-[#f7f2ea] p-0.5">
          {(["sk", "en", "de"] as const).map(value => <button key={value} type="button" onClick={() => setLang(value)} aria-pressed={lang === value} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase transition-colors ${lang === value ? "bg-[#78552f] text-white" : "text-[#766a5c] hover:bg-white"}`}>{value}</button>)}
        </div>
      </div>
    </Group>

    {message && !editing && <p role="status" aria-live="polite" className="px-2 text-center text-[12px] text-[#6b6256]">{message}</p>}
    <p className="px-2 pb-2 text-center text-[11px] text-[#766e64]">{t.appName} · {t.orchestra}</p>
  </div>
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[.1em] text-[#766a5c]">{title}</h2><div className="overflow-hidden rounded-[18px] border border-[#8b6f4b]/15 bg-white shadow-[0_2px_8px_rgba(62,48,30,0.025)]">{children}</div></section>
}

function ReadOnlyRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 border-b border-[#8b6f4b]/10 px-4 py-3.5 last:border-0 max-[360px]:flex-wrap">
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f3eee7] text-[#806442] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:stroke-[1.75]">{icon}</span>
    <span className="flex-1 text-[13px] font-medium">{label}</span>
    <span className="min-w-0 max-w-[60%] text-right text-[12px] leading-relaxed text-[#6b6256] [overflow-wrap:anywhere] max-[360px]:order-last max-[360px]:ml-11 max-[360px]:max-w-none max-[360px]:basis-full max-[360px]:text-left">{value}</span>
  </div>
}

function Field({ label, value, onChange, type = "text", required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; maxLength: number }) {
  return <label className="flex items-center gap-3 border-b border-[#8b6f4b]/10 px-4 py-3.5 last:border-0 max-[360px]:flex-wrap">
    <span className="flex-1 text-[13px] font-medium">{label}</span>
    <input type={type} value={value} onChange={event => onChange(event.target.value)} required={required} maxLength={maxLength} className="min-w-0 max-w-[60%] rounded-lg border border-[#8b6f4b]/20 bg-[#fffdf9] px-2.5 py-2 text-right text-[12px] text-[#594b3a] outline-none focus:border-[#78552f] focus:ring-2 focus:ring-[#78552f]/15 max-[360px]:max-w-none max-[360px]:basis-full" />
  </label>
}
