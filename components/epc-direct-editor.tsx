"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { setManualIpTime, setManualService } from "@/app/actions/time-entries"

type Entry = {
  id: number
  date: string
  type: string
  title: string
  hours: string
  status: string
  notes: string | null
  startTime?: string | null
  endTime?: string | null
}

type Slot = 1 | 2

type DraftMap = Record<string, string>

const MONTHS = [
  "január", "február", "marec", "apríl", "máj", "jún",
  "júl", "august", "september", "október", "november", "december",
]

const overlaySelector =
  '[class*="pointer-events-none"][class*="absolute"][class*="inset-0"][class*="text-black"]'

const rangeKey = (date: string, slot: Slot) => `${date}:ip${slot}`

function compactTime(value: string) {
  const clean = value.trim()
  if (!clean) return null
  const match = clean.match(/^(\d{1,2})(?::(\d{1,2}))?$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = match[2] == null ? 0 : Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function parseRange(value: string): [string | null, string | null] | null {
  const clean = value.trim()
  if (!clean) return [null, null]
  const parts = clean.split(/\s*[-–—]\s*/)
  if (parts.length !== 2) return null
  const start = compactTime(parts[0])
  const end = compactTime(parts[1])
  if (!start || !end) return null
  return [start, end]
}

function displayRange(entry: Entry | undefined) {
  if (!entry || entry.status === "removed" || !entry.startTime || !entry.endTime) return ""
  return `${entry.startTime}-${entry.endTime}`
}

export function EpcDirectEditor({ year, month }: { year: number; month: number }) {
  const [overlay, setOverlay] = useState<HTMLElement | null>(null)
  const [activeYear, setActiveYear] = useState(year)
  const [activeMonth, setActiveMonth] = useState(month)
  const [entries, setEntries] = useState<Entry[]>([])
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [invalid, setInvalid] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const readDisplayedMonth = () => {
    const node = document.querySelector<HTMLElement>(overlaySelector)
    const spans = node?.querySelectorAll(":scope > span")
    const monthText = spans?.[0]?.textContent?.trim().toLocaleLowerCase("sk-SK") ?? ""
    const yearText = spans?.[1]?.textContent?.trim() ?? ""
    const parsedMonth = MONTHS.indexOf(monthText)
    const parsedYear = Number(yearText)
    return {
      node,
      shownYear: Number.isFinite(parsedYear) && parsedYear > 2000 ? parsedYear : year,
      shownMonth: parsedMonth >= 0 ? parsedMonth : month,
    }
  }

  const load = async (y: number, m: number) => {
    const response = await fetch(`/api/timesheet?year=${y}&month=${m}`, { cache: "no-store" })
    if (!response.ok) return
    const next = (await response.json()) as Entry[]
    setEntries(next)

    const nextDrafts: DraftMap = {}
    const days = new Date(y, m + 1, 0).getDate()
    for (let day = 1; day <= days; day++) {
      const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayEntries = next.filter(entry => entry.date === date && entry.status !== "suggested")
      const ips = dayEntries
        .filter(entry => entry.type === "individual" || entry.type === "ip")
        .sort((a, b) => String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")))
      nextDrafts[rangeKey(date, 1)] = displayRange(ips[0])
      nextDrafts[rangeKey(date, 2)] = displayRange(ips[1])
    }
    setDrafts(nextDrafts)
    setInvalid({})
  }

  useEffect(() => {
    let observer: MutationObserver | undefined
    let timer = 0

    const attach = () => {
      const current = readDisplayedMonth()
      if (!current.node) {
        timer = window.setTimeout(attach, 200)
        return
      }

      setOverlay(current.node)
      setActiveYear(current.shownYear)
      setActiveMonth(current.shownMonth)

      observer = new MutationObserver(() => {
        const changed = readDisplayedMonth()
        if (!changed.node) return
        setOverlay(changed.node)
        setActiveYear(changed.shownYear)
        setActiveMonth(changed.shownMonth)
      })
      observer.observe(current.node, { childList: true, subtree: true, characterData: true })
    }

    attach()
    return () => {
      observer?.disconnect()
      window.clearTimeout(timer)
    }
  }, [year, month])

  useEffect(() => {
    load(activeYear, activeMonth)
  }, [activeYear, activeMonth])

  const days = useMemo(
    () => Array.from({ length: new Date(activeYear, activeMonth + 1, 0).getDate() }, (_, index) => index + 1),
    [activeYear, activeMonth],
  )

  const toggleService = async (date: string, slot: Slot, active: boolean) => {
    const key = `${date}:service${slot}`
    setSaving(state => ({ ...state, [key]: true }))
    try {
      await setManualService(date, slot, !active)
      await load(activeYear, activeMonth)
    } finally {
      setSaving(state => ({ ...state, [key]: false }))
    }
  }

  const saveRange = async (date: string, slot: Slot) => {
    const key = rangeKey(date, slot)
    const parsed = parseRange(drafts[key] ?? "")
    if (!parsed) {
      setInvalid(state => ({ ...state, [key]: true }))
      return
    }

    setInvalid(state => ({ ...state, [key]: false }))
    setSaving(state => ({ ...state, [key]: true }))
    try {
      await setManualIpTime(date, slot, parsed[0], parsed[1])
      await load(activeYear, activeMonth)
    } finally {
      setSaving(state => ({ ...state, [key]: false }))
    }
  }

  if (!overlay) return null

  return createPortal(
    <div className="pointer-events-none absolute inset-0 z-[65]" data-epc-direct-editor="true">
      {days.map(day => {
        const date = `${activeYear}-${String(activeMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const dayEntries = entries.filter(entry => entry.date === date && entry.status !== "suggested")
        const work = dayEntries
          .filter(entry => entry.type !== "individual" && entry.type !== "ip")
          .sort((a, b) => String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")))
        const ips = dayEntries
          .filter(entry => entry.type === "individual" || entry.type === "ip")
          .sort((a, b) => String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")))
        const rowTop = 17.186 + (day - 1) * 2.0829
        const service1 = !!work[0] && work[0].status !== "removed"
        const service2 = !!work[1] && work[1].status !== "removed"
        const ip1Key = rangeKey(date, 1)
        const ip2Key = rangeKey(date, 2)

        return (
          <div key={date}>
            <button
              type="button"
              aria-label={`${date} 1. služba – kliknutím prepnete X`}
              onClick={() => toggleService(date, 1, service1)}
              className="pointer-events-auto absolute flex items-center justify-center bg-white text-black outline-none focus:ring-1 focus:ring-black/30"
              style={{ left: "17.06%", top: `${rowTop + 0.10}%`, width: "7.45%", height: "1.78%" }}
            >
              <span className="text-[clamp(7px,1.35vw,12px)] font-normal leading-none">{service1 ? "X" : ""}</span>
            </button>

            <button
              type="button"
              aria-label={`${date} 2. služba – kliknutím prepnete X`}
              onClick={() => toggleService(date, 2, service2)}
              className="pointer-events-auto absolute flex items-center justify-center bg-white text-black outline-none focus:ring-1 focus:ring-black/30"
              style={{ left: "24.86%", top: `${rowTop + 0.12}%`, width: "7.44%", height: "1.76%" }}
            >
              <span className="text-[clamp(7px,1.35vw,12px)] font-normal leading-none">{service2 ? "X" : ""}</span>
            </button>

            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              aria-label={`${date} individuálna príprava 1`}
              placeholder=""
              value={drafts[ip1Key] ?? displayRange(ips[0])}
              onChange={event => {
                const value = event.target.value
                setDrafts(state => ({ ...state, [ip1Key]: value }))
                if (invalid[ip1Key]) setInvalid(state => ({ ...state, [ip1Key]: false }))
              }}
              onBlur={() => saveRange(date, 1)}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
              className={`pointer-events-auto absolute bg-white px-[2px] text-[clamp(4px,.85vw,8px)] text-black outline-none ${invalid[ip1Key] ? "ring-1 ring-red-500" : "focus:ring-1 focus:ring-black/25"}`}
              style={{ left: "38.55%", top: `${rowTop + 0.12}%`, width: "20.18%", height: "1.72%" }}
            />

            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              aria-label={`${date} individuálna príprava 2`}
              placeholder=""
              value={drafts[ip2Key] ?? displayRange(ips[1])}
              onChange={event => {
                const value = event.target.value
                setDrafts(state => ({ ...state, [ip2Key]: value }))
                if (invalid[ip2Key]) setInvalid(state => ({ ...state, [ip2Key]: false }))
              }}
              onBlur={() => saveRange(date, 2)}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
              className={`pointer-events-auto absolute bg-white px-[2px] text-[clamp(4px,.85vw,8px)] text-black outline-none ${invalid[ip2Key] ? "ring-1 ring-red-500" : "focus:ring-1 focus:ring-black/25"}`}
              style={{ left: "65.02%", top: `${rowTop + 0.15}%`, width: "19.72%", height: "1.68%" }}
            />

            {(saving[`${date}:service1`] || saving[`${date}:service2`] || saving[ip1Key] || saving[ip2Key]) && (
              <span
                className="pointer-events-none absolute rounded-full bg-black/55"
                style={{ left: "86.0%", top: `${rowTop + 0.82}%`, width: "3px", height: "3px" }}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>,
    overlay,
  )
}
