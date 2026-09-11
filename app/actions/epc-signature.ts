'use server'
import { getUserId } from '@/lib/session'
import { readReport, writeReport } from '@/lib/epc/report-store'
import { revalidatePath } from 'next/cache'
import type { Ensemble } from '@/lib/epc/model'
export async function getEpcSignature(year:number,month:number) {
  return readReport(await getUserId(),year,month)
}
export async function saveEpcSignature(year:number,month:number,signatureData:string,onlyIfEmpty=false) {
  const result=await writeReport(await getUserId(),year,month,{signatureData},onlyIfEmpty)
  revalidatePath('/timesheet');return result
}
export async function saveEpcEnsemble(year:number,month:number,ensemble:Ensemble,onlyIfEmpty=false) {
  return writeReport(await getUserId(),year,month,{ensemble},onlyIfEmpty)
}
