import assert from 'node:assert/strict'
import { readFile,writeFile,mkdir } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import {headerRect,signatureRect} from '../lib/epc/layout'
import { createEpcPdf } from '../lib/epc/pdf'
import { type Entry,geometry } from '../lib/epc/model'
async function main(){
 const options={template:await readFile('public/epc-blank.pdf'),fontBytes:await readFile('public/fonts/EpcSans.ttf'),year:2026,month:5,name:'Žofia Juráňová',now:new Date('2026-06-11T12:00:00Z')}
 const entries:Entry[]=[
 {id:1,date:'2026-06-01',type:'manual-service',title:'Manuálne pridaná 2. služba',hours:'0',status:'manual',notes:'[epc-slot:service:2]'},
 {id:2,date:'2026-06-01',type:'individual',title:'IP',hours:'2.5',status:'manual',notes:'[epc-slot:ip:2]',startTime:'15:15',endTime:'17:45'},
 {id:3,date:'2026-06-15',type:'rehearsal',title:'Future',hours:'3',status:'auto',notes:null,startTime:'09:00',endTime:'12:00'},
 {id:4,date:'2026-06-02',type:'rehearsal',title:'Removed',hours:'0',status:'removed',notes:null,startTime:'09:00',endTime:'12:00'},
 ]
 const bytes=await createEpcPdf({...options,entries,ensemble:'orchester'})
 const pdf=await PDFDocument.load(bytes),form=pdf.getForm()
 assert.equal(pdf.getPageCount(),1);assert.equal(pdf.getPages()[0].getWidth(),geometry.width)
 assert.equal(form.getFields().length,128)
 assert.equal(form.getCheckBox('Check Box 1.1').isChecked(),false)
 assert.equal(form.getCheckBox('Check Box 1.2').isChecked(),true)
 assert.equal(form.getCheckBox('Check Box 2.1').isChecked(),false)
 assert.equal(form.getCheckBox('Check Box 15.1').isChecked(),false)
 assert.equal(form.getTextField('Dropdown 1.2').getText(),'15:15-17:45')
 assert.equal(form.getTextField('Meno').getText(),'Žofia Juráňová')
 for(const f of form.getFields()) {
   const h=f.getName()==='Podpis'?signatureRect():headerRect(f.getName()),r=h?[h.x,h.y,h.x+h.width,h.y+h.height]:(geometry.fields as Record<string,number[]>)[f.getName()],rect=f.acroField.getWidgets()[0].getRectangle()
   assert.ok(Math.abs(rect.x-r[0])<.001&&Math.abs(rect.y-r[1])<.001&&Math.abs(rect.width-(r[2]-r[0]))<.001)
   assert.ok(f.acroField.getWidgets()[0].getAppearances()?.normal)
 }
 await mkdir('test-output',{recursive:true});await writeFile('test-output/epc-fixture.pdf',bytes)
 const empty=await createEpcPdf({...options,name:'',entries:[]})
 const emptyForm=(await PDFDocument.load(empty)).getForm()
 assert.ok(emptyForm.getFields().filter(f=>f.getName().startsWith('Check Box')).every(f=>!emptyForm.getCheckBox(f.getName()).isChecked()))
 console.log('PDF: 128 editable fields, preserved grid, aligned headers, Unicode, slot 2, removed/future exclusions and appearances passed.')
}
main()
