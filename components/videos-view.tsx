"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { CalendarDays, MapPin, Play, Search, SlidersHorizontal, X } from "lucide-react"
import type { OfficialArchiveItem } from "@/lib/concert-archive"

const filters = [
  { label: "Všetko", test: () => true },
  { label: "Orchester", test: (v: OfficialArchiveItem) => /symfon|orchestr|filharmón/i.test(`${v.category} ${v.performers}`) },
  { label: "Komorné", test: (v: OfficialArchiveItem) => /komorn|quart|kvart|ensemble|recitál/i.test(`${v.category} ${v.title}`) },
  { label: "Zbor", test: (v: OfficialArchiveItem) => /zbor|SFZ|BChZ/i.test(`${v.category} ${v.performers}`) },
  { label: "Pre deti", test: (v: OfficialArchiveItem) => /akadém|rodinn|škôlk|mikuláš/i.test(`${v.category} ${v.title}`) },
  { label: "Rozhovory", test: (v: OfficialArchiveItem) => /rozhovor|beseda/i.test(`${v.category} ${v.title}`) },
] as const

const fullDateFormatter = new Intl.DateTimeFormat("sk-SK", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const monthFormatter = new Intl.DateTimeFormat("sk-SK", {
  month: "long",
  year: "numeric",
})

function formatDate(value: string) {
  return fullDateFormatter.format(new Date(`${value}T12:00:00`))
}

function monthLabel(value: string) {
  const label = monthFormatter.format(new Date(`${value}T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function ArchiveImage({ video, priority = false }: { video: OfficialArchiveItem; priority?: boolean }) {
  if (!video.thumbnailUrl) {
    return <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,#57412b_0,transparent_35%),linear-gradient(135deg,#241c18,#070707_72%)]" />
  }

  return (
    <Image
      src={video.thumbnailUrl}
      alt=""
      fill
      priority={priority}
      unoptimized
      sizes="(max-width: 460px) 100vw, 460px"
      className="object-cover transition duration-700 group-hover:scale-[1.025]"
    />
  )
}

export function VideosView({ initialVideos }: { initialVideos: OfficialArchiveItem[] }) {
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("Všetko")

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("sk")
    const filter = filters.find((item) => item.label === activeFilter) ?? filters[0]

    return initialVideos.filter((video) => {
      const haystack = [video.title, video.performers, video.program, video.venue, video.category]
        .join(" ")
        .toLocaleLowerCase("sk")
      return filter.test(video) && (!q || haystack.includes(q))
    })
  }, [activeFilter, initialVideos, query])

  const featured = filtered[0]
  const archive = filtered.slice(1)
  const groups = useMemo(() => archive.reduce<Array<{ label: string; videos: OfficialArchiveItem[] }>>((all, video) => {
    const label = monthLabel(video.date)
    const current = all.at(-1)
    if (current?.label === label) current.videos.push(video)
    else all.push({ label, videos: [video] })
    return all
  }, []), [archive])

  return (
    <div className="-mx-5 -mt-2 min-h-svh overflow-hidden bg-[#0b0b0c] text-[#f7f4ed]">
      <header className="relative px-5 pb-5 pt-7">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#b88a55]/15 blur-3xl" />
        <p className="relative text-[10px] font-semibold uppercase tracking-[.22em] text-[#c7a16f]">Slovenská filharmónia</p>
        <div className="relative mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[38px] font-semibold leading-none tracking-[-.055em]">Koncertný archív</h1>
            <p className="mt-2 text-[12px] text-white/45">Záznamy od sezóny 2025/2026</p>
          </div>
          <span className="mb-0.5 shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] tabular-nums text-white/55">
            {filtered.length} videí
          </span>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Hľadať skladbu, interpreta, dirigenta…"
            aria-label="Hľadať v koncertnom archíve"
            className="h-12 w-full rounded-2xl border border-white/[.09] bg-white/[.065] pl-10 pr-11 text-[13px] text-white outline-none placeholder:text-white/28 focus:border-[#c7a16f]/60 focus:bg-white/[.08]"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Vymazať hľadanie" className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/55">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              aria-pressed={activeFilter === filter.label}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-medium ${activeFilter === filter.label ? "border-[#c7a16f] bg-[#c7a16f] text-[#17110b]" : "border-white/10 bg-white/[.035] text-white/56"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <main className="pb-10">
        {featured && (
          <section className="px-5 pb-8">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
              <span className="h-px w-5 bg-[#c7a16f]" /> Najnovší záznam
            </p>
            <a href={featured.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-[22px] border border-white/[.08] bg-[#151516] shadow-2xl shadow-black/40">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#161312]">
                <ArchiveImage video={featured} priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-medium">
                    <span className="rounded-full bg-[#d8ae76] px-2.5 py-1 text-[#17110b]">{featured.category}</span>
                    <span className="text-white/68">{formatDate(featured.date)}</span>
                  </div>
                  <h2 className="max-w-[95%] text-[28px] font-semibold leading-[1.02] tracking-[-.045em]">{featured.title}</h2>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/58">{featured.performers}</p>
                  <span className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[11px] font-semibold text-black">
                    <Play className="h-3.5 w-3.5 fill-current" /> Prehrať záznam
                  </span>
                </div>
              </div>
            </a>
          </section>
        )}

        {groups.map((group) => (
          <section key={group.label} className="border-t border-white/[.07] px-5 py-6 [content-visibility:auto] [contain-intrinsic-size:780px]">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-.035em]">{group.label}</h2>
              <span className="text-[10px] text-white/32">{group.videos.length} {group.videos.length === 1 ? "záznam" : "záznamov"}</span>
            </div>

            <div className="space-y-4">
              {group.videos.map((video) => (
                <a key={video.id} href={video.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[128px_1fr] gap-3 overflow-hidden rounded-[18px] border border-white/[.075] bg-[#141415] p-2.5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#211c18]">
                    <ArchiveImage video={video} />
                    <div className="absolute inset-0 bg-black/12" />
                    <span className="absolute bottom-2 left-2 grid h-8 w-8 place-items-center rounded-full bg-white/92 text-black shadow-lg">
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                    </span>
                    {video.partial && <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide">Výber</span>}
                  </div>

                  <div className="min-w-0 py-0.5 pr-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[.11em] text-[#c7a16f]">{video.category}</p>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-[1.12] tracking-[-.025em]">{video.title}</h3>
                    <p className="mt-2 line-clamp-1 text-[10px] text-white/43">{video.performers}</p>
                    <div className="mt-2 flex items-center gap-2 text-[9px] text-white/32">
                      <CalendarDays className="h-3 w-3" />
                      <span>{formatDate(video.date)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        {!featured && (
          <div className="mx-5 mt-3 rounded-[22px] border border-white/[.08] bg-white/[.035] px-6 py-14 text-center">
            <SlidersHorizontal className="mx-auto h-5 w-5 text-white/32" />
            <p className="mt-3 text-[14px] font-medium">Nenašli sa žiadne záznamy</p>
            <p className="mt-1 text-[11px] text-white/38">Skús iný výraz alebo zruš filter.</p>
          </div>
        )}

        <div className="mx-5 mt-2 flex items-start gap-2 border-t border-white/[.07] pt-5 text-[9px] leading-relaxed text-white/28">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <p>Oficiálne záznamy Koncertného archívu Slovenskej filharmónie. Videá sa otvárajú na stream.filharmonia.art.</p>
        </div>
      </main>
    </div>
  )
}
