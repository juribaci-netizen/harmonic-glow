import assert from 'node:assert/strict'
import { readReport,writeReport } from '../lib/epc/report-store'
import { pool } from '../lib/db'
async function main(){
 if(!process.env.DATABASE_URL?.includes('127.0.0.1:55439'))throw new Error('This test requires the isolated local test database.')
 const saved=await readReport('worktime-demo-user',2026,8)
 assert.ok(saved.signatureData?.startsWith('data:image/png;base64,'));assert.equal(saved.ensemble,'orchester')
 assert.equal((await readReport('worktime-demo-user',2026,7)).signatureData,null)
 assert.equal((await readReport('another-test-employee',2026,8)).signatureData,null)
 await writeReport('another-test-employee',2026,8,{ensemble:'zbor'})
 assert.equal((await readReport('worktime-demo-user',2026,8)).ensemble,'orchester')
 const rows=await pool.query('SELECT * FROM time_entry WHERE "userId"=$1 AND date=$2',['worktime-demo-user','2026-09-01'])
 assert.ok(rows.rows.some(e=>e.notes?.includes('[epc-slot:service:2]')&&e.status==='manual'))
 assert.ok(rows.rows.some(e=>e.notes?.includes('[epc-slot:ip:2]')&&e.startTime==='15:15'&&e.endTime==='17:45'&&Number(e.hours)===2.5))
 console.log('Storage: browser edits persisted in database; signature and ensemble isolated by employee, month, year.')
 await pool.end()
}
main()
