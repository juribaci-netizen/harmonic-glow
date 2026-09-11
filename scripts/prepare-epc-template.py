"""Extract immutable page geometry and a blank vector template from the supplied EPČ.
Usage: python scripts/prepare-epc-template.py /path/to/reference.pdf
Render public/epc-blank.pdf with: pdftoppm -scale-to 1684 -png -singlefile public/epc-blank.pdf public/epc-blank
Requires pypdf. Never copy widget values or appearance streams into the background.
"""
import json,sys
from pathlib import Path
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject
reader=PdfReader(sys.argv[1]);page=reader.pages[0]
canonical=reader.get_fields() or {}
widgets=[a.get_object() for a in page['/Annots'] if a.get_object().get('/Subtype')=='/Widget']
assert len(widgets)==132 and len({w['/T'] for w in widgets})==132
assert all('/Parent' not in w and '/Kids' not in w for w in widgets)
# The eight canonical fields are distinct objects from their same-named page widgets.
# Do not reattach them: extract only geometry and rebuild one canonical tree on export.
canonical_ids={a.idnum for a in reader.trailer['/Root']['/AcroForm']['/Fields']}
widget_ids={a.idnum for a in page['/Annots']}
assert not canonical_ids.intersection(widget_ids)
geometry={'width':float(page.mediabox.width),'height':float(page.mediabox.height),'fields':{str(w['/T']):[float(v) for v in w['/Rect']] for w in widgets}}
Path('lib/epc/geometry.json').write_text(json.dumps(geometry,indent=2)+'\n')
writer=PdfWriter();writer.add_page(page);writer.remove_annotations(subtypes='/Widget')
writer.root_object.pop(NameObject('/AcroForm'),None)
writer.compress_identical_objects(remove_identicals=True,remove_orphans=True)
writer.write('public/epc-blank.pdf')
blank=PdfReader('public/epc-blank.pdf')
assert not blank.get_fields()
assert not blank.pages[0].get('/Annots').get_object()
print(f'Inspected {len(canonical)} canonical fields and {len(widgets)} widgets; wrote clean page without field values.')
