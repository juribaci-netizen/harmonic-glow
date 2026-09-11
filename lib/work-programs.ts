import { seasonData } from './season-data-2026-27'
import { canChooseParticipation } from './work-plan'

// Explicit program runs from the published season plan. Different wording of a
// rehearsal's repertoire must not split it from its concert, nor merge later runs.
const runs = [
  ['cd-2026-09','Nahrávanie propagačného CD','2026-09-08','2026-09-16','recording'],
  ['bhs-young-2026','Otvárací koncert BHS · Bella, Mozart, Mahler','2026-09-19','2026-09-23','Simone Young'],
  ['bellini-2026','Bellini · Kapuletovci a Montekovci','2026-09-30','2026-10-04','Gianluca Capuano'],
  ['mahler2-2026','Mahler · Symfónia č. 2','2026-10-06','2026-10-11','Yutaka Sado'],
  ['olos-opening-2026','Otváracie koncerty 78. sezóny','2026-10-19','2026-10-23','Ondrej Olos'],
  ['bergmann-2026-10','Rossini, Prokofiev, Šeherezáda','2026-10-26','2026-10-29','Rune Bergmann'],
  ['praha-2026-11','Koncert v Prahe','2026-11-02','2026-11-04','travel'],
  ['breiner-2026','Rok slovenskej hudby','2026-11-05','2026-11-07','Peter Breiner'],
  ['valcuha-2026','Respighi, Ravel, Prokofiev','2026-11-09','2026-11-13','Juraj Valčuha'],
  ['marshall-2026','Poulenc · Holst: Planéty','2026-11-16','2026-11-20','Wayne Marshall'],
  ['margita-2026','Štefan Margita 70','2026-11-23','2026-11-26','Jan Kučera'],
  ['olos-2026-12','Dohnányi, Németh-Šamorínsky, Čajkovskij','2026-11-30','2026-12-04','Ondrej Olos'],
  ['zehnder-2026','Mel Bonis, Poulenc, Dvořák','2026-12-07','2026-12-11','Kaspar Zehnder'],
  ['vianoce-2026','Vianočné koncerty','2026-12-15','2026-12-20','Lukáš Vasilek'],
  ['novy-rok-2027','Silvestrovský a novoročné koncerty','2026-12-28','2027-01-02','Erik Nielsen'],
] as const
export type WorkProgram = {id:string;title:string;start:string;end:string;activityIds:number[]}
const programs = new Map<string,WorkProgram>()
export const programByActivity = new Map<number,WorkProgram>()
seasonData.forEach((activity,index)=>{
  if(!canChooseParticipation(activity))return
  const run=runs.find(([, ,start,end,match])=>activity.date>=start&&activity.date<=end&&(
    match==='recording'?activity.type==='recording':match==='travel'?!/konkurz/i.test(activity.title):activity.conductor===match || (match==='Lukáš Vasilek'&&activity.date==='2026-12-17'&&activity.title.startsWith('Cesta vlakom'))))
  const id=run?.[0]??`service:${activity.date}:${activity.startTime??'unknown'}:${activity.title}`
  let program=programs.get(id)
  if(!program){program={id,title:run?.[1]??activity.title,start:run?.[2]??activity.date,end:run?.[3]??activity.date,activityIds:[]};programs.set(id,program)}
  program.activityIds.push(index+1);programByActivity.set(index+1,program)
})
export const workPrograms=[...programs.values()]
