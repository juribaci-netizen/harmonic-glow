import type { InferInsertModel } from "drizzle-orm"
import { concertVideo } from "@/lib/db/schema"

export type ArchiveItem = InferInsertModel<typeof concertVideo>

export type OfficialArchiveItem = {
  id: number
  code: string
  title: string
  date: string
  performers: string
  program: string
  venue: string
  category: string
  season: string
  url: string
  thumbnailUrl: string | null
  partial: boolean
}

type OfficialArchiveResponse = {
  concerts?: Array<{
    c_id: number
    c_code: string
    c_name: string
    c_date: string
    c_performers_short: string | null
    c_program_short: string | null
    venue_sk: string | null
    cycle_sk: string | null
    season_sk: string | null
    c_has_video: number
    banner_url: string | null
    venue_img: string | null
    c_partial: number
  }>
}

const ARCHIVE_START = "2025-08-01"
const ARCHIVE_ORIGIN = "https://stream.filharmonia.art"

function absoluteImageUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    return new URL(value, ARCHIVE_ORIGIN).toString()
  } catch {
    return null
  }
}

/**
 * Loads the official archive instead of maintaining a second, quickly outdated
 * hand-written catalogue. Two pages comfortably cover every recording since
 * August 2025 and leave headroom for newly published concerts.
 */
export async function getOfficialConcertArchive(): Promise<OfficialArchiveItem[]> {
  try {
    const pages = await Promise.all([1, 2].map(async (page) => {
      const response = await fetch(`${ARCHIVE_ORIGIN}/api/concerts?page=${page}&perPage=100`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) throw new Error(`Archive request failed (${response.status})`)
      return response.json() as Promise<OfficialArchiveResponse>
    }))

    return pages
      .flatMap((page) => page.concerts ?? [])
      .filter((concert) => concert.c_date >= ARCHIVE_START && concert.c_has_video === 1)
      .map((concert) => ({
        id: concert.c_id,
        code: concert.c_code,
        title: concert.c_name,
        date: concert.c_date,
        performers: concert.c_performers_short ?? "",
        program: concert.c_program_short ?? "",
        venue: concert.venue_sk ?? "",
        category: concert.cycle_sk ?? "Koncert",
        season: concert.season_sk ?? "",
        url: `${ARCHIVE_ORIGIN}/koncert/${encodeURIComponent(concert.c_code)}`,
        thumbnailUrl: absoluteImageUrl(concert.banner_url || concert.venue_img),
        partial: concert.c_partial === 1,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return concertArchiveSeed.map((concert, index) => ({
      id: index + 1,
      code: `fallback-${index + 1}`,
      title: concert.title,
      date: concert.date ?? "",
      performers: concert.conductor ?? "",
      program: concert.description ?? "",
      venue: concert.venue ?? "",
      category: "Koncert",
      season: "Sezóna 2025/2026",
      url: concert.url ?? ARCHIVE_ORIGIN,
      thumbnailUrl: concert.thumbnailUrl ?? null,
      partial: false,
    }))
  }
}

// Featured recordings from the official Slovak Philharmonic concert archive.
export const concertArchiveSeed: ArchiveItem[] = [
  {
    title: "Mozart",
    date: "2026-06-21",
    conductor: "Ewald Danel · Adam Sedlický",
    venue: "Koncertná sieň Slovenskej filharmónie",
    description: "Slovenský komorný orchester · Slovenský filharmonický zbor",
    url: "https://stream.filharmonia.art/?/koncert/KS202606211530",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg",
  },
  {
    title: "Mendelssohn / Bartók / Holst / Bloch",
    date: "2026-03-12",
    conductor: "Ewald Danel · Kadesha",
    venue: "Slovenská filharmónia",
    description: "Slovenský komorný orchester · Mendelssohn Bartholdy · Bartók · Holst · Bloch",
    url: "https://stream.filharmonia.art/?/koncert/KS202603121900",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2023/06/005-SKO-SZMB-foto-A-TRIZULJAK-w-scaled.jpg",
  },
  {
    title: "Koncert bez bariér",
    date: "2026-06-14",
    conductor: "Ewald Danel",
    venue: "Stĺpová sieň Slovenskej filharmónie",
    description: "Slovenský komorný orchester · Ježek · Bella · Bach · Čajkovskij",
    url: "https://stream.filharmonia.art/?/koncert/SS202606141600",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2023/06/005-SKO-SZMB-foto-A-TRIZULJAK-w-scaled.jpg",
  },
  {
    title: "Študenti VŠMU v Bratislave a Akadémie umení v Banskej Bystrici",
    date: "2026-06-10",
    conductor: "Rastislav Štúr",
    venue: "Koncertná sieň Slovenskej filharmónie",
    description: "Slovenská filharmónia · Ricotti · Dvořák · Chausson · Borodin · Casella · Béres · Berg",
    url: "https://stream.filharmonia.art/?/koncert/KS202606101900",
    thumbnailUrl: "https://operaslovakia.sk/wp-content/uploads/2015/06/SF-Ewald-Danel-%C2%A9-Photo-A.-Trizuljak-DSC_6479.jpg",
  },
  {
    title: "Le Nuove Musiche",
    date: "2026-06-09",
    conductor: "J. Hinnerk Andresen · J. Mitrík",
    venue: "Koncertná sieň Slovenskej filharmónie",
    description: "Le Nuove Musiche · Schimrack, d. Ä. · Zarevúcky · Gabrieli",
    url: "https://stream.filharmonia.art/?/koncert/KS202606091900",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg",
  },
  {
    title: "Wolfgang Amadeus Mozart",
    date: "2026-05-30",
    conductor: "Ewald Danel",
    venue: "Slovenská filharmónia",
    description: "Slovenský komorný orchester · Wolfgang Amadeus Mozart",
    url: "https://stream.filharmonia.art/?/koncert/KS202605301600",
    thumbnailUrl: "https://operaslovakia.sk/wp-content/uploads/2015/06/SF-Ewald-Danel-%C2%A9-Photo-A.-Trizuljak-DSC_6479.jpg",
  },
  {
    title: "Beseda s Danielom Raiskinom",
    date: "2026-06-05",
    conductor: "Daniel Raiskin · Martin Bubnáš",
    venue: "Slovenská filharmónia",
    description: "Rozhovor / beseda · Beethoven · Brahms",
    url: "https://stream.filharmonia.art/",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg",
  },
  {
    title: "Beseda s Milanom Paľom a Ondrejom Olosom",
    date: "2026-04-16",
    conductor: "Ondrej Olos · Milan Paľa · Martin Bubnáš",
    venue: "Slovenská filharmónia",
    description: "Rozhovor / beseda · Walton · Cikker · Rachmaninov",
    url: "https://stream.filharmonia.art/",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg",
  },
  {
    title: "Beseda s Mariánom Lejavom a Ondrejom Veselým",
    date: "2026-02-06",
    conductor: "Marián Lejava · Ondrej Veselý · Martin Bubnáš",
    venue: "Slovenská filharmónia",
    description: "Rozhovor / beseda · Parík · Zimmer · Honegger",
    url: "https://stream.filharmonia.art/",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2023/06/005-SKO-SZMB-foto-A-TRIZULJAK-w-scaled.jpg",
  }
].sort((a,b)=>(b.date ?? "").localeCompare(a.date ?? ""))
