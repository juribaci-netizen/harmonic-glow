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
