// Slovak Philharmonic — season work plan 2026 / 2027 (24 Aug 2026 – 3 Jan 2027).
// Shared schedule seeded for all members. Times in 24h local format.

export type SeasonActivity = {
  date: string
  type: "rehearsal" | "concert" | "recording" | "dress" | "off" | "ip" | "other"
  startTime: string | null
  endTime: string | null
  title: string
  conductor: string | null
  venue: string | null
  program: string | null
}

export const seasonData: SeasonActivity[] = [
  // Season opening week
  { date: "2026-08-24", type: "ip", startTime: null, endTime: null, title: "Individuálna príprava", conductor: null, venue: "Domáca príprava", program: "Príprava na otváraciu sezónu" },
  { date: "2026-08-25", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — otvárací koncert", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Beethoven: Symfónia č. 3 Eroica" },
  { date: "2026-08-26", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — otvárací koncert", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Beethoven: Symfónia č. 3 Eroica" },
  { date: "2026-08-27", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Beethoven: Symfónia č. 3 Eroica" },
  { date: "2026-08-28", type: "concert", startTime: "19:00", endTime: "21:00", title: "Otvárací koncert sezóny", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Beethoven: Symfónia č. 3 Eroica; Egmont — predohra" },
  { date: "2026-08-29", type: "off", startTime: null, endTime: null, title: "Voľno", conductor: null, venue: null, program: null },
  { date: "2026-08-30", type: "off", startTime: null, endTime: null, title: "Voľno", conductor: null, venue: null, program: null },

  // September
  { date: "2026-09-08", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Petr Popelka", venue: "Koncertná sieň SF", program: "Dvořák: Symfónia č. 9 Z Nového sveta" },
  { date: "2026-09-09", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Petr Popelka", venue: "Koncertná sieň SF", program: "Dvořák: Symfónia č. 9; Martinů: Koncert pre husle" },
  { date: "2026-09-10", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka", conductor: "Petr Popelka", venue: "Koncertná sieň SF", program: "Dvořák: Symfónia č. 9 Z Nového sveta" },
  { date: "2026-09-11", type: "concert", startTime: "19:00", endTime: "21:15", title: "Abonentný koncert A", conductor: "Petr Popelka", venue: "Koncertná sieň SF", program: "Dvořák: Symfónia č. 9; Martinů: Koncert pre husle" },
  { date: "2026-09-12", type: "concert", startTime: "19:00", endTime: "21:15", title: "Abonentný koncert A", conductor: "Petr Popelka", venue: "Koncertná sieň SF", program: "Dvořák: Symfónia č. 9; Martinů: Koncert pre husle" },
  { date: "2026-09-22", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Suchoň: Metamorfózy; Brahms: Symfónia č. 2" },
  { date: "2026-09-23", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Brahms: Symfónia č. 2" },
  { date: "2026-09-24", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Brahms: Symfónia č. 2" },
  { date: "2026-09-25", type: "concert", startTime: "19:00", endTime: "21:00", title: "Abonentný koncert B", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Suchoň: Metamorfózy; Brahms: Symfónia č. 2" },

  // October — recording sessions + concerts
  { date: "2026-10-06", type: "recording", startTime: "10:00", endTime: "13:00", title: "Nahrávanie CD", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Slovenská hudba 20. storočia — I." },
  { date: "2026-10-07", type: "recording", startTime: "10:00", endTime: "13:00", title: "Nahrávanie CD", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Slovenská hudba 20. storočia — II." },
  { date: "2026-10-08", type: "recording", startTime: "14:00", endTime: "17:00", title: "Nahrávanie CD", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Slovenská hudba 20. storočia — III." },
  { date: "2026-10-15", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Juraj Valčuha", venue: "Koncertná sieň SF", program: "Mahler: Symfónia č. 5" },
  { date: "2026-10-16", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Juraj Valčuha", venue: "Koncertná sieň SF", program: "Mahler: Symfónia č. 5" },
  { date: "2026-10-17", type: "dress", startTime: "10:00", endTime: "13:00", title: "Generálka", conductor: "Juraj Valčuha", venue: "Koncertná sieň SF", program: "Mahler: Symfónia č. 5" },
  { date: "2026-10-18", type: "concert", startTime: "19:00", endTime: "21:20", title: "Abonentný koncert C", conductor: "Juraj Valčuha", venue: "Koncertná sieň SF", program: "Mahler: Symfónia č. 5" },
  { date: "2026-10-23", type: "off", startTime: null, endTime: null, title: "Voľno", conductor: null, venue: null, program: null },

  // November — touring + subscription
  { date: "2026-11-03", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Emmanuel Villaume", venue: "Koncertná sieň SF", program: "Debussy: More; Ravel: Bolero" },
  { date: "2026-11-04", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška", conductor: "Emmanuel Villaume", venue: "Koncertná sieň SF", program: "Debussy: More; Ravel: Daphnis a Chloé" },
  { date: "2026-11-05", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka", conductor: "Emmanuel Villaume", venue: "Koncertná sieň SF", program: "Ravel: Bolero; Daphnis a Chloé" },
  { date: "2026-11-06", type: "concert", startTime: "19:00", endTime: "21:00", title: "Francúzsky večer", conductor: "Emmanuel Villaume", venue: "Koncertná sieň SF", program: "Debussy: More; Ravel: Bolero, Daphnis a Chloé" },
  { date: "2026-11-13", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — zájazd", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Čajkovskij: Symfónia č. 6 Patetická" },
  { date: "2026-11-14", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka — zájazd", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Čajkovskij: Symfónia č. 6 Patetická" },
  { date: "2026-11-16", type: "concert", startTime: "19:30", endTime: "21:30", title: "Zájazd — Viedeň", conductor: "Daniel Raiskin", venue: "Musikverein, Viedeň", program: "Čajkovskij: Symfónia č. 6 Patetická" },
  { date: "2026-11-17", type: "concert", startTime: "20:00", endTime: "22:00", title: "Zájazd — Praha", conductor: "Daniel Raiskin", venue: "Rudolfinum, Praha", program: "Čajkovskij: Symfónia č. 6 Patetická" },
  { date: "2026-11-18", type: "off", startTime: null, endTime: null, title: "Voľno po zájazde", conductor: null, venue: null, program: null },

  // December — Advent & Christmas
  { date: "2026-12-01", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — adventný koncert", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Bach: Vianočné oratórium (výber)" },
  { date: "2026-12-02", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — adventný koncert", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Bach: Vianočné oratórium (výber)" },
  { date: "2026-12-03", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Bach: Vianočné oratórium (výber)" },
  { date: "2026-12-04", type: "concert", startTime: "19:00", endTime: "21:00", title: "Adventný koncert", conductor: "Leoš Svárovský", venue: "Koncertná sieň SF", program: "Bach: Vianočné oratórium (výber)" },
  { date: "2026-12-15", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — vianočný koncert", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Händel: Mesiáš" },
  { date: "2026-12-16", type: "rehearsal", startTime: "10:00", endTime: "13:00", title: "Skúška — vianočný koncert", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Händel: Mesiáš" },
  { date: "2026-12-17", type: "dress", startTime: "10:00", endTime: "13:00", title: "Generálka", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Händel: Mesiáš" },
  { date: "2026-12-18", type: "concert", startTime: "19:00", endTime: "21:30", title: "Vianočný koncert", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Händel: Mesiáš" },
  { date: "2026-12-19", type: "concert", startTime: "17:00", endTime: "19:30", title: "Vianočný koncert", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", program: "Händel: Mesiáš" },
  { date: "2026-12-23", type: "off", startTime: null, endTime: null, title: "Vianočné voľno", conductor: null, venue: null, program: null },
  { date: "2026-12-24", type: "off", startTime: null, endTime: null, title: "Vianočné voľno", conductor: null, venue: null, program: null },
  { date: "2026-12-25", type: "off", startTime: null, endTime: null, title: "Vianočné voľno", conductor: null, venue: null, program: null },
  { date: "2026-12-26", type: "off", startTime: null, endTime: null, title: "Vianočné voľno", conductor: null, venue: null, program: null },

  // New Year
  { date: "2026-12-30", type: "dress", startTime: "10:00", endTime: "12:30", title: "Generálka — Silvestrovský koncert", conductor: "Rastislav Štúr", venue: "Koncertná sieň SF", program: "Strauss: Netopier — predohra; valčíky a polky" },
  { date: "2026-12-31", type: "concert", startTime: "17:00", endTime: "19:00", title: "Silvestrovský koncert", conductor: "Rastislav Štúr", venue: "Koncertná sieň SF", program: "Strauss: valčíky, polky a árie" },
  { date: "2027-01-01", type: "concert", startTime: "18:00", endTime: "20:00", title: "Novoročný koncert", conductor: "Rastislav Štúr", venue: "Koncertná sieň SF", program: "Strauss: valčíky, polky a árie" },
  { date: "2027-01-02", type: "off", startTime: null, endTime: null, title: "Voľno", conductor: null, venue: null, program: null },
  { date: "2027-01-03", type: "off", startTime: null, endTime: null, title: "Voľno", conductor: null, venue: null, program: null },
]

export const concertVideoSeed = [
  { title: "Otvárací koncert sezóny 2026/2027", date: "2026-08-28", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", description: "Beethoven: Symfónia č. 3 Eroica a predohra Egmont.", url: "https://www.youtube.com/watch?v=hxbLM_TdBQY" },
  { title: "Dvořák: Symfónia č. 9 Z Nového sveta", date: "2026-09-11", conductor: "Petr Popelka", venue: "Koncertná sieň SF", description: "Abonentný koncert A s husľovým koncertom B. Martinů.", url: "https://www.youtube.com/watch?v=hxbLM_TdBQY" },
  { title: "Mahler: Symfónia č. 5", date: "2026-10-18", conductor: "Juraj Valčuha", venue: "Koncertná sieň SF", description: "Monumentálne dielo v podaní Slovenskej filharmónie.", url: "https://www.youtube.com/watch?v=hxbLM_TdBQY" },
  { title: "Francúzsky večer — Ravel & Debussy", date: "2026-11-06", conductor: "Emmanuel Villaume", venue: "Koncertná sieň SF", description: "Bolero, Daphnis a Chloé a symfonické skice More.", url: "https://www.youtube.com/watch?v=hxbLM_TdBQY" },
  { title: "Händel: Mesiáš — Vianočný koncert", date: "2026-12-18", conductor: "Daniel Raiskin", venue: "Koncertná sieň SF", description: "Tradičný vianočný koncert so zborom a sólistami.", url: "https://www.youtube.com/watch?v=hxbLM_TdBQY" },
  { title: "Silvestrovský koncert", date: "2026-12-31", conductor: "Rastislav Štúr", venue: "Koncertná sieň SF", description: "Slávnostný záver roka s hudbou rodiny Straussovcov.", url: "https://www.youtube.com/watch?v=hxbLM_TdBQY" },
]
