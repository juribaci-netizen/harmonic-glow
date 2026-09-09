"use client"

import { useEffect, useState } from "react"

type Ensemble = "orchester" | "zbor" | "sko"

const OPTIONS: { value: Ensemble; label: string }[] = [
  { value: "orchester", label: "Orchester" },
  { value: "zbor", label: "Zbor" },
  { value: "sko", label: "SKO" },
]

export function MonthEnsembleChoice({ year, month }: { year: number; month: number }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const key = `epc-ensemble:${year}-${month}`
    const saved = window.localStorage.getItem(key) as Ensemble | null
    if (saved === "orchester" || saved === "zbor" || saved === "sko") {
      document.documentElement.dataset.epcEnsemble = saved
      setOpen(false)
      return
    }

    delete document.documentElement.dataset.epcEnsemble
    setOpen(true)
  }, [year, month])

  const choose = (value: Ensemble) => {
    window.localStorage.setItem(`epc-ensemble:${year}-${month}`, value)
    document.documentElement.dataset.epcEnsemble = value
    window.dispatchEvent(new CustomEvent("epc-ensemble-change", { detail: { year, month, value } }))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-5 backdrop-blur-sm">
      <div className="w-full max-w-[390px] rounded-[28px] bg-white p-5 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-black/35">EPČ · nový mesiac</p>
        <h2 className="mt-2 text-[25px] font-semibold tracking-[-.04em]">Vyberte súbor</h2>
        <p className="mt-1 text-[13px] leading-5 text-black/45">Túto voľbu stačí potvrdiť raz za mesiac.</p>

        <div className="mt-5 grid gap-2">
          {OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className="flex min-h-14 items-center justify-center rounded-[18px] border border-black/[.07] bg-black/[.025] px-4 text-[17px] font-medium tracking-[-.02em] hover:bg-black/[.055]"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
