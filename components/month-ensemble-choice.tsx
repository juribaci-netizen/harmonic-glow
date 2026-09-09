"use client"

import { useEffect, useState } from "react"

type Ensemble = "orchester" | "zbor" | "sko"

const OPTIONS: { value: Ensemble; label: string }[] = [
  { value: "orchester", label: "Orchester" },
  { value: "zbor", label: "Zbor" },
  { value: "sko", label: "SKO" },
]

const MONTHS = [
  "január", "február", "marec", "apríl", "máj", "jún",
  "júl", "august", "september", "október", "november", "december",
]

const ensembleKey = (year: number, month: number) => `epc-ensemble-v2:${year}-${month}`

export function MonthEnsembleChoice({ year, month }: { year: number; month: number }) {
  const [open, setOpen] = useState(false)
  const [activeYear, setActiveYear] = useState(year)
  const [activeMonth, setActiveMonth] = useState(month)
  const [selected, setSelected] = useState<Ensemble | null>(null)

  useEffect(() => {
    let cleanupOverlay: (() => void) | undefined
    let observer: MutationObserver | undefined

    const readDisplayedMonth = () => {
      const overlay = document.querySelector(
        '[class*="pointer-events-none"][class*="absolute"][class*="inset-0"][class*="text-black"]'
      )
      const spans = overlay?.querySelectorAll(":scope > span")
      const monthText = spans?.[0]?.textContent?.trim().toLocaleLowerCase("sk-SK") ?? ""
      const yearText = spans?.[1]?.textContent?.trim() ?? ""
      const parsedMonth = MONTHS.indexOf(monthText)
      const parsedYear = Number(yearText)

      return {
        overlay: overlay as HTMLElement | null,
        shownYear: Number.isFinite(parsedYear) && parsedYear > 2000 ? parsedYear : year,
        shownMonth: parsedMonth >= 0 ? parsedMonth : month,
      }
    }

    const ensureCleanOrchester = (overlay: HTMLElement) => {
      let clean = overlay.querySelector<HTMLDivElement>("#epc-orchester-clean-cover")
      if (clean) return clean

      clean = document.createElement("div")
      clean.id = "epc-orchester-clean-cover"
      Object.assign(clean.style, {
        position: "absolute",
        left: "57.65%",
        top: "7.72%",
        width: "11.35%",
        height: "3.65%",
        background: "#fff",
        zIndex: "18",
        pointerEvents: "none",
        boxSizing: "border-box",
      })

      const label = document.createElement("span")
      label.textContent = "Orchester"
      Object.assign(label.style, {
        position: "absolute",
        left: "10%",
        right: "4%",
        top: "29%",
        height: "44%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#111",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "clamp(5px,.82vw,9px)",
        fontWeight: "400",
        lineHeight: "1",
        whiteSpace: "nowrap",
      })
      clean.appendChild(label)
      overlay.appendChild(clean)
      return clean
    }

    const sync = () => {
      const { overlay, shownYear, shownMonth } = readDisplayedMonth()
      if (!overlay) return

      setActiveYear(shownYear)
      setActiveMonth(shownMonth)
      ensureCleanOrchester(overlay)

      const saved = window.localStorage.getItem(ensembleKey(shownYear, shownMonth)) as Ensemble | null
      const valid = saved === "orchester" || saved === "zbor" || saved === "sko"

      if (valid) {
        document.documentElement.dataset.epcEnsemble = saved
        setSelected(saved)
      } else {
        delete document.documentElement.dataset.epcEnsemble
        setSelected(null)
      }

      let hit = overlay.querySelector<HTMLButtonElement>("#epc-ensemble-hit-area")
      if (!hit) {
        hit = document.createElement("button")
        hit.id = "epc-ensemble-hit-area"
        hit.type = "button"
        hit.setAttribute("aria-label", "Vybrať súbor: Orchester, Zbor alebo SKO")
        Object.assign(hit.style, {
          position: "absolute",
          left: "57.8%",
          top: "8.0%",
          width: "26.2%",
          height: "3.4%",
          zIndex: "40",
          pointerEvents: "auto",
          background: "transparent",
          border: "0",
          padding: "0",
          cursor: "pointer",
        })

        const warning = document.createElement("span")
        warning.dataset.epcEnsembleWarning = "true"
        warning.textContent = "!"
        Object.assign(warning.style, {
          position: "absolute",
          right: "-5%",
          top: "-24%",
          width: "16px",
          height: "16px",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          border: "1px solid #c51b1b",
          color: "#c51b1b",
          fontSize: "11px",
          fontWeight: "600",
          lineHeight: "1",
          boxSizing: "border-box",
        })
        hit.appendChild(warning)
        hit.addEventListener("click", () => {
          const current = readDisplayedMonth()
          const currentSaved = window.localStorage.getItem(ensembleKey(current.shownYear, current.shownMonth)) as Ensemble | null
          const currentValid = currentSaved === "orchester" || currentSaved === "zbor" || currentSaved === "sko"
          setActiveYear(current.shownYear)
          setActiveMonth(current.shownMonth)
          setSelected(currentValid ? currentSaved : null)
          setOpen(true)
        })
        overlay.appendChild(hit)
      }

      const warning = hit.querySelector<HTMLElement>('[data-epc-ensemble-warning="true"]')
      if (warning) warning.style.display = valid ? "none" : "flex"
    }

    const attach = () => {
      sync()
      const { overlay } = readDisplayedMonth()
      if (!overlay) {
        const timer = window.setTimeout(attach, 250)
        cleanupOverlay = () => window.clearTimeout(timer)
        return
      }

      observer = new MutationObserver(sync)
      observer.observe(overlay, { subtree: true, childList: true, characterData: true })
      cleanupOverlay = () => {
        observer?.disconnect()
        overlay.querySelector("#epc-ensemble-hit-area")?.remove()
        overlay.querySelector("#epc-orchester-clean-cover")?.remove()
      }
    }

    attach()
    return () => cleanupOverlay?.()
  }, [year, month])

  const choose = (value: Ensemble) => {
    window.localStorage.setItem(ensembleKey(activeYear, activeMonth), value)
    document.documentElement.dataset.epcEnsemble = value
    setSelected(value)
    const warning = document.querySelector<HTMLElement>('[data-epc-ensemble-warning="true"]')
    if (warning) warning.style.display = "none"
    window.dispatchEvent(new CustomEvent("epc-ensemble-change", {
      detail: { year: activeYear, month: activeMonth, value },
    }))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-5 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-[390px] rounded-[28px] bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
        <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-black/35">EPČ</p>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-.04em]">Vyberte súbor</h2>
        <p className="mt-1 text-[13px] leading-5 text-black/45">Vybrať môžete iba jednu možnosť. Nový výber automaticky nahradí predchádzajúci.</p>

        <div className="mt-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Súbor EPČ">
          {OPTIONS.map(option => {
            const active = selected === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(option.value)}
                className={"flex min-h-14 items-center justify-center rounded-[18px] border px-3 text-[15px] font-medium tracking-[-.02em] " + (active ? "border-black bg-black text-white" : "border-black/[.08] bg-black/[.025] hover:bg-black/[.06]")}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
