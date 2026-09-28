'use server'
import { getTimeEntries,setManualIpTime } from './time-entries'
import { readPreparationPreferences } from '@/lib/epc/preparation-preferences-store'
import { getUserId } from '@/lib/session'
import { validateMonth } from '@/lib/epc/model'
import { preparationRepairs,type PreparationRepair } from '@/lib/epc/preparation-repairs'

export async function proposeEpcRepairs(year:number,month:number){
  validateMonth(year,month)
  const userId=await getUserId()
  const [entries,preferences]=await Promise.all([getTimeEntries(),readPreparationPreferences(userId)])
  return preparationRepairs(entries,year,month,preferences)
}
export async function confirmEpcRepair(year:number,month:number,proposal:PreparationRepair){
  const fresh=await proposeEpcRepairs(year,month)
  const match=fresh.find(p=>p.date===proposal.date&&p.slot===proposal.slot&&p.startTime===proposal.startTime&&p.endTime===proposal.endTime&&p.missingHours===proposal.missingHours&&p.replacesCleared===proposal.replacesCleared)
  if(!match)throw new Error('Výkaz sa zmenil. Zobrazte nový návrh a skontrolujte ho.')
  return setManualIpTime(match.date,match.slot,match.startTime,match.endTime)
}
