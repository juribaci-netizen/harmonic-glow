"use client"

import { useEffect, useState } from "react"

type Ensemble = "orchester" | "zbor" | "sko"

type EnsembleOption = {
  value: Ensemble
  label: string
  frameLeft: string
  frameWidth: string
}

const OPTIONS: EnsembleOption[] = [
  { value: "orchester", label: "Orchester", frameLeft: "59.00%", frameWidth: "9.82%" },
  { value: "zbor", label: "Zbor", frameLeft: "69.82%", frameWidth: "5.40%" },
  { value: "sko", label: "SKO", frameLeft: "78.30%", frameWidth: "5.52%" },
]

const MONTHS = [
  "január", "február", "marec", "apríl", "máj", "jún",
  "júl", "august", "september", "október", "november", "december",
]

const ensembleKey = (year: number, month: number) => `epc-ensemble-v3:${year}-${month}`

const isEnsemble = (value: string | null): value is Ensemble =>
  value === "orchester" || value === "zbor" || value === "sko"

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

    const ensureFrameLayer = (overlay: HTMLElement) => {
      let layer = overlay.querySelector<HTMLDivElement>("#epc-ensemble-frame-layer")
      if (layer) return layer

      layer = document.createElement("div")
      layer.id = "epc-ensemble-frame-layer"
      Object.assign(layer.style, {
        position: "absolute",
        inset: "0",
        zIndex: "18",
        pointerEvents: "none",
        background: "transparent",
      })

      const frame = document.createElement("div")
      frame.id = "epc-ensemble-selection-frame"
      Object.assign(frame.style, {
        position: "absolute",
        top: "10.5065%",
        height: "1.95%",
        border: "1px solid #111",
        background: "transparent",
        boxSizing: "border-box",
        display: "none",
        zIndex: "20",
      })
      layer.appendChild(frame)
      overlay.appendChild(layer)
      return layer
    }

    const setFrame = (layer: HTMLElement, value: Ensemble | null) => {
      const frame = layer.querySelector<HTMLElement>("#epc-ensemble-selection-frame")
      if (!frame) return
      const option = value ? OPTIONS.find(item => item.value === value) : undefined
      if (!option) {
        frame.style.display = "none"
        return
      }
      frame.style.left = option.frameLeft
      frame.style.width = option.frameWidth
      frame.style.display = "block"
    }

    const sync = () => {
      const { overlay, shownYear, shownMonth } = readDisplayedMonth()
      if (!overlay) return

      setActiveYear(shownYear)
      setActiveMonth(shownMonth)
      delete document.documentElement.dataset.epcEnsemble

      const layer = ensureFrameLayer(overlay)
      const saved = window.localStorage.getItem(ensembleKey(shownYear, shownMonth))
      const value = isEnsemble(saved) ? saved : null
      setSelected(value)
      setFrame(layer, value)

      let hit = overlay.querySelector<HTMLButtonElement>("#epc-ensemble-hit-area")
      if (!hit) {
        hit = document.createElement("button")
        hit.id = "epc-ensemble-hit-area"
        hit.type = "button"
        hit.setAttribute("aria-label", "Vybrať súbor: Orchester, Zbor alebo SKO")
        Object.assign(hit.style, {
          position: "absolute",
          left: "58.65%",
          top: "9.9265%",
          width: "25.45%",
          height: "2.72%",
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
          right: "-2px",
          top: "-7px",
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
          const currentSaved = window.localStorage.getItem(ensembleKey(current.shownYear, current.shownMonth))
          const currentValue = isEnsemble(currentSaved) ? currentSaved : null
          setActiveYear(current.shownYear)
          setActiveMonth(current.shownMonth)
          setSelected(currentValue)
          setOpen(true)
        })
        overlay.appendChild(hit)
      }

      const warning = hit.querySelector<HTMLElement>('[data-epc-ensemble-warning="true"]')
      if (warning) warning.style.display = value ? "none" : "flex"
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
        overlay.querySelector("#epc-ensemble-frame-layer")?.remove()
      }
    }

    attach()
    return () => cleanupOverlay?.()
  }, [year, month])

  const choose = (value: Ensemble) => {
    window.localStorage.setItem(ensembleKey(activeYear, activeMonth), value)
    setSelected(value)

    const overlay = document.querySelector<HTMLElement>(
      '[class*="pointer-events-none"][class*="absolute"][class*="inset-0"][class*="text-black"]'
    )
    const layer = overlay?.querySelector<HTMLElement>("#epc-ensemble-frame-layer")
    const frame = layer?.querySelector<HTMLElement>("#epc-ensemble-selection-frame")
    const option = OPTIONS.find(item => item.value === value)
    if (frame && option) {
      frame.style.left = option.frameLeft
      frame.style.width = option.frameWidth
      frame.style.display = "block"
    }

    const warning = overlay?.querySelector<HTMLElement>('[data-epc-ensemble-warning="true"]')
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
