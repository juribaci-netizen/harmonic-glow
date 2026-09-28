import assert from 'node:assert/strict'
import { submissionIssues } from '../lib/epc/submission-validation'
const base={fullName:'Test User',ensemble:'orchester' as const,signatureData:'data:image/png;base64,test',entries:[],weeklyTotals:['2026-08-31','2026-09-07','2026-09-14','2026-09-21','2026-09-28'].map(weekStart=>({weekStart,totalHours:38.5}))}
const issues=(patch:Partial<typeof base>)=>submissionIssues({...base,...patch},2026,8)
assert.equal(issues({}).length,0)
for(const totalHours of [38.5,39,39.5])assert.equal(issues({weeklyTotals:base.weeklyTotals.map(w=>({...w,totalHours}))}).length,0)
for(const totalHours of [38,39.51,NaN])assert(issues({weeklyTotals:base.weeklyTotals.map(w=>({...w,totalHours}))}).length>0)
assert(issues({fullName:' '}).some(x=>x.includes('meno')))
assert(submissionIssues({...base,ensemble:null,signatureData:null},2026,8).length===2)
assert(issues({weeklyTotals:[]}).length===5)
const entry={id:1,date:'2020-09-01',type:'individual',title:'IP',hours:'2',status:'manual',notes:null,startTime:'09:00',endTime:'11:00'}
assert.equal(submissionIssues({...base,entries:[entry]},2026,8).length,0)
assert(submissionIssues({...base,entries:[{...entry,endTime:null}]},2026,8).some(x=>x.includes('časy')))
assert(submissionIssues({...base,entries:[{...entry,hours:'3'}]},2026,8).some(x=>x.includes('časy')))
assert(submissionIssues({...base,entries:[entry,{...entry,id:2}]},2026,8).some(x=>x.includes('prekrývajú')))
assert.equal(submissionIssues({...base,entries:[{...entry,date:'2200-09-01',status:'auto'}]},2026,8).length,0)
console.log('Submission validation checks passed')
