"use server"
import {getUserId} from '@/lib/session'
import {writePreparationPreferences} from '@/lib/epc/preparation-preferences-store'
import {type PreparationPreferences} from '@/lib/epc/preparation-preferences'
import {revalidatePath} from 'next/cache'
export async function savePreparationPreferences(preferences:PreparationPreferences){
  const userId=await getUserId()
  const result=await writePreparationPreferences(userId,preferences)
  revalidatePath('/timesheet')
  return result
}
