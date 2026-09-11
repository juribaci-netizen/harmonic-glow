import rangeBaselines from './range-baselines.json'
import { fieldRect, geometry } from './model'

export const previewCrop = {left:60,right:60,top:18,bottom:18}
export const headerFontSize = 12
export function headerRect(name:string) {
  if(!['Mesiac','Rok','Meno'].includes(name))return null
  const original=fieldRect(name)
  // Printed label baselines are 773.0551 and 743.655 PDF points.
  const baseline=name==='Meno'?745.2:774.6
  const y=baseline-4,height=18
  return {...original,y,height,top:geometry.height-y-height,baseline}
}

export const rangeFontSize = 11
export function signatureRect() {
  const original=fieldRect('Podpis'),y=76.4951,height=original.y+original.height-y
  return {...original,x:original.x+10,y,width:original.width-20,height,top:geometry.height-y-height}
}

export function rangeBaseline(name:string) {
  const day=Number(name.match(/^Dropdown (\d+)\.[12]$/)?.[1])
  if(day<1||day>31||!Number.isInteger(day))throw new Error('Invalid IP field '+name)
  return rangeBaselines[day-1]
}

export function rangeInputPadding(name:string) {
  const r=fieldRect(name)
  // EpcSans ascent/descent: 1854/-434 at 2048 units per em. Match the
  // native input's baseline to the same printed baseline used by SVG/PDF.
  const baselineOffset=rangeFontSize*(1854-434)/(2*2048)
  return Math.max(0,2*(r.height/2-(rangeBaseline(name)-r.y)-baselineOffset))
}
