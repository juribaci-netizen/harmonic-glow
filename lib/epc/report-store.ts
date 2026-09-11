import { pool } from '@/lib/db'
import { validateMonth, type Ensemble } from './model'

// Additive, idempotent storage: never rewrites time entries or existing signatures.
let ready:Promise<unknown>|undefined
async function ensureTable() {
  if(!ready) ready=pool.query(`CREATE TABLE IF NOT EXISTS epc_report (
    user_id text NOT NULL, year integer NOT NULL, month integer NOT NULL,
    signature_data text, ensemble text, updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, year, month)
  )`).catch(error=>{ready=undefined;throw error})
  await ready
}
export async function readReport(userId:string,year:number,month:number) {
  validateMonth(year,month);await ensureTable()
  const result=await pool.query('SELECT signature_data, ensemble FROM epc_report WHERE user_id=$1 AND year=$2 AND month=$3',[userId,year,month])
  return {signatureData:(result.rows[0]?.signature_data??null) as string|null,ensemble:(result.rows[0]?.ensemble??null) as Ensemble|null}
}
export async function writeReport(userId:string,year:number,month:number,patch:{signatureData?:string;ensemble?:Ensemble},onlyIfEmpty=false) {
  validateMonth(year,month);await ensureTable()
  if(patch.signatureData!==undefined) {
    if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(patch.signatureData) || patch.signatureData.length>1_000_000) throw new Error('Neplatný podpis.')
    await pool.query(`INSERT INTO epc_report (user_id,year,month,signature_data) VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id,year,month) DO UPDATE SET signature_data=${onlyIfEmpty?'COALESCE(epc_report.signature_data,EXCLUDED.signature_data)':'EXCLUDED.signature_data'}, updated_at=now()`,[userId,year,month,patch.signatureData])
  }
  if(patch.ensemble!==undefined) {
    if(!['orchester','zbor','sko'].includes(patch.ensemble))throw new Error('Neplatný súbor.')
    await pool.query(`INSERT INTO epc_report (user_id,year,month,ensemble) VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id,year,month) DO UPDATE SET ensemble=${onlyIfEmpty?'COALESCE(epc_report.ensemble,EXCLUDED.ensemble)':'EXCLUDED.ensemble'}, updated_at=now()`,[userId,year,month,patch.ensemble])
  }
  return readReport(userId,year,month)
}
