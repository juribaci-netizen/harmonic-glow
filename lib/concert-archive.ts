export type ArchiveItem = {
  title: string
  date: string
  ensemble: string
  conductor: string
  venue: string
  program: string
  url: string
  thumbnailUrl: string | null
}

// Latest featured recordings currently surfaced by the Slovak Philharmonic archive.
// The source archive currently reports 839 recordings and 3273 works.
export const concertArchiveSeed: ArchiveItem[] = [
  {
    title: "Mozart",
    date: "2026-06-21",
    ensemble: "Slovenský komorný orchester · Slovenský filharmonický zbor",
    conductor: "Ewald Danel · Adam Sedlický",
    venue: "Koncertná sieň Slovenskej filharmónie",
    program: "W. A. Mozart — Sláčikové kvarteto č. 19 C dur KV 465; Omša c mol KV 427",
    url: "https://www.filharmonia.sk/s03-2026",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg",
  },
  {
    title: "Mendelssohn / Bartók / Holst / Bloch",
    date: "2026-03-12",
    ensemble: "Slovenský komorný orchester",
    conductor: "Ewald Danel · Kadesha",
    venue: "Slovenská filharmónia",
    program: "Mendelssohn Bartholdy · Bartók · Holst · Bloch",
    url: "https://stream.filharmonia.art/concerts",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2023/06/005-SKO-SZMB-foto-A-TRIZULJAK-w-scaled.jpg",
  },
  {
    title: "Koncert bez bariér",
    date: "2026-06-14",
    ensemble: "Slovenský komorný orchester",
    conductor: "Ewald Danel",
    venue: "Stĺpová sieň Slovenskej filharmónie",
    program: "Ježek · Bella · Bach · Čajkovskij",
    url: "https://stream.filharmonia.art/concerts",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2023/06/005-SKO-SZMB-foto-A-TRIZULJAK-w-scaled.jpg",
  },
  {
    title: "Študenti VŠMU v Bratislave a Akadémie umení v Banskej Bystrici",
    date: "2026-06-10",
    ensemble: "Slovenská filharmónia",
    conductor: "Rastislav Štúr",
    venue: "Koncertná sieň Slovenskej filharmónie",
    program: "Ricotti · Dvořák · Chausson · Borodin · Casella · Béres · Berg",
    url: "https://stream.filharmonia.art/concerts",
    thumbnailUrl: "https://operaslovakia.sk/wp-content/uploads/2015/06/SF-Ewald-Danel-%C2%A9-Photo-A.-Trizuljak-DSC_6479.jpg",
  },
  {
    title: "Le Nuove Musiche",
    date: "2026-06-09",
    ensemble: "Le Nuove Musiche",
    conductor: "J. Hinnerk Andresen · J. Mitrík",
    venue: "Koncertná sieň Slovenskej filharmónie",
    program: "Schimrack, d. Ä. · Zarevúcky · Gabrieli",
    url: "https://stream.filharmonia.art/concerts",
    thumbnailUrl: "https://www.bhsfestival.sk/wp-content/uploads/2025/04/Slovenska-filharmonia-a-Daniel-Raiskin-foto-Peter-Brenkus-9859-2.jpg",
  },
  {
    title: "Wolfgang Amadeus Mozart",
    date: "2026-05-30",
    ensemble: "Slovenský komorný orchester",
    conductor: "Ewald Danel",
    venue: "Slovenská filharmónia",
    program: "Wolfgang Amadeus Mozart",
    url: "https://stream.filharmonia.art/concerts",
    thumbnailUrl: "https://operaslovakia.sk/wp-content/uploads/2015/06/SF-Ewald-Danel-%C2%A9-Photo-A.-Trizuljak-DSC_6479.jpg",
  },
]
