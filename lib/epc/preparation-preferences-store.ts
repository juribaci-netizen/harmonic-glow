import { pool } from '../db'
import { DEFAULT_PREPARATION_PREFERENCES,validatePreparationPreferences,type PreparationPreferences } from './preparation-preferences'
let ready:Promise<unknown>|undefined
async function ensureStore(){
  if(!ready)ready=pool.query('CREATE TABLE IF NOT EXISTS epc_preparation_preferences (user_id text PRIMARY KEY, preferences jsonb NOT NULL)').catch(error=>{ready=undefined;throw error})
  await ready
}
export async function readPreparationPreferences(userId:string):Promise<PreparationPreferences>{
  await ensureStore()
  const result=await pool.query('SELECT preferences FROM epc_preparation_preferences WHERE user_id=$1',[userId])
  return result.rows[0]?validatePreparationPreferences(result.rows[0].preferences):{...DEFAULT_PREPARATION_PREFERENCES}
}
export async function writePreparationPreferences(userId:string,value:PreparationPreferences){
  const preferences=validatePreparationPreferences(value)
  await ensureStore()
  await pool.query('INSERT INTO epc_preparation_preferences(user_id,preferences) VALUES ($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET preferences=EXCLUDED.preferences',[userId,JSON.stringify(preferences)])
  return preferences
}
