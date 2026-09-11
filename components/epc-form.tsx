'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { geometry, fieldRect, dayValues, MONTHS, bratislavaNow, type Entry, type Slot, type Ensemble } from '@/lib/epc/model'
import styles from './epc-form.module.css'

function position(name:string):CSSProperties {
  const r=fieldRect(name)
  return {left:r.x,top:r.top,width:r.width,height:r.height}
}
function TimeCell({name,value,disabled,onSave,onDirty}:{name:string;value:string;disabled:boolean;onSave:(value:string)=>Promise<void>;onDirty:(dirty:boolean)=>void}) {
  const [draft,setDraft]=useState(value),[error,setError]=useState(false)
  const focused=useRef(false),latest=useRef(value)
  latest.current=value
  useEffect(()=>{if(!focused.current&&!error)setDraft(value)},[value,error])
  const save=async()=>{
    focused.current=false
    if(draft===latest.current){onDirty(false);return}
    try {await onSave(draft);setError(false);onDirty(false)}catch{setError(true);onDirty(true)}
  }
  return <input data-epc-field={name} className={`${styles.field} ${name==='Meno'?styles.name:styles.range}`} style={position(name)}
    aria-label={name==='Meno'?'Meno a priezvisko v EPČ':name.replace(/Dropdown (\d+)\.([12])/, "$1. deň – individuálna príprava $2")} aria-invalid={error} title={name==='Meno'?'Oprava sa uloží aj do profilu. Potvrďte klávesom Enter alebo kliknutím mimo poľa.':'Čas od–do, napríklad 08:00-12:00. Prázdne pole čas vymaže.'}
    autoComplete="off" spellCheck={false} value={draft} disabled={disabled}
    onFocus={()=>{focused.current=true}} onChange={e=>{setDraft(e.target.value);setError(false);onDirty(e.target.value!==latest.current)}}
    onBlur={save} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}if(e.key==='Escape'){setDraft(value);setError(false);onDirty(false)}}}/>
}
export function EpcForm({entries,year,month,name,signatureData,ensemble,zoom,busy,onService,onRange,onName,onDirty}:{entries:Entry[];year:number;month:number;name:string;signatureData:string|null;ensemble:Ensemble|null;zoom:number;busy:boolean;onService:(date:string,slot:Slot,value:boolean)=>Promise<void>;onRange:(date:string,slot:Slot,value:string)=>Promise<void>;onName:(value:string)=>Promise<void>;onDirty:(key:string,dirty:boolean)=>void}) {
  const host=useRef<HTMLDivElement>(null),[width,setWidth]=useState(geometry.width),[now,setNow]=useState(()=>bratislavaNow())
  useEffect(()=>{const node=host.current;if(!node)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(node);return()=>observer.disconnect()},[])
  useEffect(()=>{const timer=setInterval(()=>setNow(bratislavaNow()),30000);return()=>clearInterval(timer)},[])
  const scale=width/geometry.width*zoom,days=new Date(year,month+1,0).getDate()
  return <div ref={host} className={styles.viewport} tabIndex={0} aria-label="Formulár EPČ; pri priblížení posúvajte do strán">
    <div style={{width:geometry.width*scale,height:geometry.height*scale}}>
      <div className={styles.paper} data-epc-paper style={{width:geometry.width,height:geometry.height,transform:`scale(${scale})`}}>
        <img className={styles.background} src="/epc-blank.png" alt="Prázdny originálny formulár EPČ" draggable={false}/>
        {[['Mesiac',MONTHS[month]],['Rok',String(year)]].map(([key,value])=><div key={key} data-epc-field={key} className={`${styles.field} ${styles.header}`} style={position(key)}>{value}</div>)}
        <TimeCell name="Meno" value={name} disabled={busy} onSave={onName} onDirty={value=>onDirty('name',value)}/>
        {ensemble&&<span data-epc-ensemble className={styles.ensemble} style={position({orchester:'Orchester',zbor:'Zbor',sko:'SKO'}[ensemble])}/>}
        {Array.from({length:31},(_,i)=>i+1).map(day=>{
          const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const values=dayValues(entries,date,now)
          return [1,2].map(n=>{
            const slot=n as Slot,check=`Check Box ${day}.${slot}`,range=`Dropdown ${day}.${slot}`
            return <div key={`${day}.${slot}`}>
              <label className={`${styles.field} ${styles.checkbox}`} style={position(check)}>
                <input data-epc-field={check} type="checkbox" aria-label={`${date} ${slot}. služba`} checked={day<=days&&values.services[slot-1]} disabled={busy||day>days}
                  onChange={e=>{void onService(date,slot,e.target.checked).catch(()=>{})}}/>
                {day<=days&&values.services[slot-1]&&<svg aria-hidden="true" width="6" height="8" viewBox="0 0 6 8"><path d="M0 0L6 8M0 8L6 0" stroke="black" strokeWidth="1"/></svg>}
              </label>
              <TimeCell key={`${date}:${slot}`} name={range} value={day<=days?values.ranges[slot-1]:''} disabled={busy||day>days}
                onSave={value=>onRange(date,slot,value)} onDirty={dirty=>onDirty(`${date}:${slot}`,dirty)}/>
            </div>
          })
        })}
        {signatureData&&<img data-epc-field="Podpis" className={`${styles.field} ${styles.signature}`} style={position('Podpis')} src={signatureData} alt="Podpis zamestnanca"/>}
      </div>
    </div>
  </div>
}
