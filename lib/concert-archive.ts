import type { InferInsertModel } from "drizzle-orm"
import { concertVideo } from "@/lib/db/schema"

export type ArchiveItem = InferInsertModel<typeof concertVideo>

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
