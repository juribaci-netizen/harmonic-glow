import { WEEKLY_TARGET_HOURS, isIp, isService, timeMinutes, type Entry, type Ensemble } from './model'

type SubmissionReport = {
  fullName: string
  ensemble: Ensemble | null
  signatureData: string | null
  entries: Entry[]
  weeklyTotals?: {weekStart:string;totalHours:number}[]
}
export function submissionIssues(report:SubmissionReport,year:number,month:number):string[] {
  const issues:string[]=[]
  if(!report.fullName?.trim())issues.push('Doplňte meno a priezvisko.')
  if(!['orchester','zbor','sko'].includes(report.ensemble??''))issues.push('Zakrúžkujte súbor: orchester, zbor alebo SKO.')
  if(!report.signatureData)issues.push('Doplňte podpis.')
  const first=new Date(Date.UTC(year,month,1)),last=new Date(Date.UTC(year,month+1,0))
  first.setUTCDate(first.getUTCDate()-(first.getUTCDay()+6)%7)
  for(let day=new Date(first);day<=last;day.setUTCDate(day.getUTCDate()+7)){
    const key=day.toISOString().slice(0,10),total=report.weeklyTotals?.find(w=>w.weekStart===key)?.totalHours
    if(total===undefined||!Number.isFinite(total))issues.push('Nedá sa overiť súčet týždňa od '+key+'.')
    else if(total<WEEKLY_TARGET_HOURS||total>WEEKLY_TARGET_HOURS+1)issues.push('Týždeň od '+key+' má '+total.toLocaleString('sk-SK')+' h. Skontrolujte fond 38,5 h (rezerva najviac 1 h).')
  }
  const active=report.entries.filter(e=>!['removed','suggested','unconfirmed'].includes(e.status)&&(isIp(e)||isService(e)))
  const invalid=active.filter(e=>{
    const start=timeMinutes(e.startTime),end=timeMinutes(e.endTime),hours=Number(e.hours)
    return start===null||end===null||end<=start||!Number.isFinite(hours)||hours<=0||Math.abs(hours*60-(end-start))>1
  })
  if(invalid.length)issues.push('Skontrolujte časy a počet hodín: '+[...new Set(invalid.map(e=>e.date))].join(', ')+'.')
  const overlapping=active.some((e,i)=>{
    const start=timeMinutes(e.startTime),end=timeMinutes(e.endTime)
    return start!==null&&end!==null&&active.slice(i+1).some(other=>{
      const s=timeMinutes(other.startTime),t=timeMinutes(other.endTime)
      return other.date===e.date&&s!==null&&t!==null&&start<t&&s<end
    })
  })
  if(overlapping)issues.push('Časové záznamy sa prekrývajú. Opravte ich pred odoslaním.')
  return issues
}
