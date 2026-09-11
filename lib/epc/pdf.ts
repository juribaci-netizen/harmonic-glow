import { PDFDocument, rgb, drawLine, pushGraphicsState, popGraphicsState } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { bratislavaNow, fieldRect, dayValues, MONTHS, validateMonth, type Entry, type Ensemble } from './model'

export async function createEpcPdf(options:{template:Uint8Array;fontBytes:Uint8Array;year:number;month:number;name:string;entries:Entry[];signatureData?:string|null;ensemble?:Ensemble|null;now?:Date}) {
  const {template,fontBytes,year,month,name,entries,signatureData,ensemble}=options
  validateMonth(year,month)
  const pdf=await PDFDocument.load(template)
  pdf.registerFontkit(fontkit)
  const font=await pdf.embedFont(fontBytes,{subset:true})
  const page=pdf.getPages()[0],form=pdf.getForm(),black=rgb(0,0,0)
  const text=(key:string,value:string,size=9)=>{
    const r=fieldRect(key),field=form.createTextField(key)
    field.setText(value)
    field.addToPage(page,{x:r.x,y:r.y,width:r.width,height:r.height,borderWidth:0,borderColor:undefined,textColor:black,backgroundColor:['Mesiac','Rok','Meno'].includes(key)?rgb(1,1,1):undefined,font})
    field.setFontSize(size)
    return field
  }
  text('Mesiac',MONTHS[month],10);text('Rok',String(year),10);text('Meno',name,10)
  for(let day=1;day<=31;day++) {
    const valid=day<=new Date(year,month+1,0).getDate()
    const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const values=valid?dayValues(entries,date,bratislavaNow(options.now)):{services:[false,false],ranges:['','']}
    for(const slot of [1,2] as const){
      const key=`Check Box ${day}.${slot}`,r=fieldRect(key),field=form.createCheckBox(key)
      field.addToPage(page,{x:r.x,y:r.y,width:r.width,height:r.height,borderWidth:0,borderColor:undefined,textColor:black,backgroundColor:undefined})
      if(values.services[slot-1])field.check();else field.uncheck()
      // Use an X matching the paper form, while keeping a real canonical checkbox.
      field.updateAppearances(()=>{
        const cx=r.width/2,cy=r.height/2
        const stroke=(x1:number,y1:number,x2:number,y2:number)=>drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},thickness:1,color:black})
        return {normal:{on:[...stroke(cx-3,cy-4,cx+3,cy+4),...stroke(cx-3,cy+4,cx+3,cy-4)],off:[pushGraphicsState(),popGraphicsState()]}}
      })
      text(`Dropdown ${day}.${slot}`,values.ranges[slot-1],9)
      if(!valid){field.enableReadOnly();form.getTextField(`Dropdown ${day}.${slot}`).enableReadOnly()}
    }
  }
  // Signature uses the exact original signature widget rectangle. The image is not part of the blank template.
  const signature=text('Podpis','',10)
  if(signatureData) {
    const png=await pdf.embedPng(signatureData)
    signature.setImage(png)
    signature.enableReadOnly()
  }
  if(ensemble) {
    const r=fieldRect({orchester:'Orchester',zbor:'Zbor',sko:'SKO'}[ensemble])
    // Plain underline, never a surrounding rectangle.
    page.drawLine({start:{x:r.x+3,y:r.y+3},end:{x:r.x+r.width-3,y:r.y+3},thickness:.7,color:black})
  }
  form.updateFieldAppearances(font)
  return pdf.save()
}
