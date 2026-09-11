'use client'
import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import { geometry, fieldRect, dayValues, MONTHS, bratislavaNow, type Entry, type Slot, type Ensemble } from '@/lib/epc/model'
import styles from './epc-form.module.css'
import {headerRect,headerFontSize,previewCrop} from '@/lib/epc/layout'

function position(name:string):CSSProperties {
  const r=headerRect(name)??fieldRect(name)
  return {left:r.x,top:r.top,width:r.width,height:r.height}
}
type RegisterSave = (name:string, save:(()=>Promise<boolean>)|null)=>void
export type EpcFormHandle = {saveChanges:()=>Promise<boolean>}
function TimeCell({name,value,disabled,onSave,onDirty,registerSave}:{name:string;value:string;disabled:boolean;onSave:(value:string)=>Promise<void>;onDirty:(dirty:boolean)=>void;registerSave:RegisterSave}) {
  const [draft,setDraft]=useState(value),[error,setError]=useState(false)
  const focused=useRef(false),latest=useRef(value),pending=useRef<Promise<boolean>|null>(null)
  latest.current=value
  useEffect(()=>{if(!focused.current&&!error)setDraft(value)},[value,error])
  const save=async()=>{
    focused.current=false
    if(pending.current)return pending.current
    if(draft===latest.current){onDirty(false);return true}
    pending.current=(async()=>{
      try {await onSave(draft);setError(false);onDirty(false);return true}catch{setError(true);onDirty(true);return false}
      finally{pending.current=null}
    })()
    return pending.current
  }
  useEffect(()=>{registerSave(name,draft!==value?save:null);return()=>registerSave(name,null)},[name,draft,value,onSave,registerSave])
  return <input data-epc-field={name} className={`${styles.field} ${name==='Meno'?styles.name:styles.range}`} style={position(name)}
    aria-label={name==='Meno'?'Meno a priezvisko v EPČ':name.replace(/Dropdown (\d+)\.([12])/, "$1. deň – individuálna príprava $2")} aria-invalid={error} title={name==='Meno'?'Oprava sa uloží aj do profilu. Potvrďte klávesom Enter alebo kliknutím mimo poľa.':'Čas od–do, napríklad 09:00-13:00. Prázdne pole čas vymaže.'}
    autoComplete="off" spellCheck={false} value={draft} disabled={disabled}
    onFocus={()=>{focused.current=true}} onChange={e=>{setDraft(e.target.value);setError(false);onDirty(e.target.value!==latest.current)}}
    onBlur={save} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}if(e.key==='Escape'){setDraft(value);setError(false);onDirty(false)}}}/>
}
export function EpcForm({entries,year,month,name,signatureData,ensemble,zoom,busy,onService,onRange,onName,onEnsemble,onDirty,editorRef}:{entries:Entry[];year:number;month:number;name:string;signatureData:string|null;ensemble:Ensemble|null;zoom:number;busy:boolean;onService:(date:string,slot:Slot,value:boolean)=>Promise<void>;onRange:(date:string,slot:Slot,value:string)=>Promise<void>;onName:(value:string)=>Promise<void>;onEnsemble:(value:Ensemble)=>Promise<void>;onDirty:(key:string,dirty:boolean)=>void;editorRef?:Ref<EpcFormHandle>}) {
  const saves=useRef(new Map<string,()=>Promise<boolean>>())
  const registerSave=useRef<RegisterSave>((name,save)=>{if(save)saves.current.set(name,save);else saves.current.delete(name)}).current
  useImperativeHandle(editorRef,()=>({saveChanges:async()=>{for(const save of [...saves.current.values()])if(!await save())return false;return true}}),[])
  const host=useRef<HTMLDivElement>(null),[width,setWidth]=useState(geometry.width),[now,setNow]=useState(()=>bratislavaNow())
  useEffect(()=>{const node=host.current;if(!node)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(node);return()=>observer.disconnect()},[])
  useEffect(()=>{const timer=setInterval(()=>setNow(bratislavaNow()),30000);return()=>clearInterval(timer)},[])
  const visibleWidth=geometry.width-previewCrop.left-previewCrop.right,visibleHeight=geometry.height-previewCrop.top-previewCrop.bottom
  const scale=width/visibleWidth*zoom,days=new Date(year,month+1,0).getDate()
  return <div ref={host} className={styles.viewport} tabIndex={0} aria-label="Formulár EPČ; pri priblížení posúvajte do strán">
    <div style={{position:"relative",overflow:"hidden",width:visibleWidth*scale,height:visibleHeight*scale}}>
      <div className={styles.paper} data-epc-paper style={{position:"absolute",left:-previewCrop.left*scale,top:-previewCrop.top*scale,width:geometry.width,height:geometry.height,transform:`scale(${scale})`}}>
        <img className={styles.background} src="/epc-blank.png" alt="Prázdny originálny formulár EPČ" draggable={false}/>
        {[['Mesiac',MONTHS[month]],['Rok',String(year)]].map(([key,value])=><svg key={key} data-epc-field={key} className={`${styles.field} ${styles.header}`} style={position(key)}><text x="1" y="14" fontSize={headerFontSize}>{value}</text></svg>)}
        <TimeCell registerSave={registerSave} name="Meno" value={name} disabled={busy} onSave={onName} onDirty={value=>onDirty('name',value)}/>
        <div role="group" aria-label="Výber súboru EPČ">
          {(['orchester','zbor','sko'] as const).map(value=>{
            const label={orchester:'Orchester',zbor:'Zbor',sko:'SKO'}[value]
            return <button key={value} type="button" aria-label={`Súbor ${label}`} title={label} aria-pressed={ensemble===value} disabled={busy}
              data-epc-ensemble={ensemble===value?'':undefined} className={`${styles.ensembleChoice} ${ensemble===value?styles.ensemble:''}`} style={position(label)}
              onClick={()=>{void onEnsemble(value).catch(()=>{})}}/>
          })}
        </div>
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
              <TimeCell registerSave={registerSave} key={`${date}:${slot}`} name={range} value={day<=days?values.ranges[slot-1]:''} disabled={busy||day>days}
                onSave={value=>onRange(date,slot,value)} onDirty={dirty=>onDirty(`${date}:${slot}`,dirty)}/>
            </div>
          })
        })}
        {signatureData&&<img data-epc-field="Podpis" className={`${styles.field} ${styles.signature}`} style={position('Podpis')} src={signatureData} alt="Podpis zamestnanca"/>}
      </div>
    </div>
  </div>
}
