"""Check logical fields AND widget states/appearances of a generated EPČ PDF."""
import sys
from pypdf import PdfReader
r=PdfReader(sys.argv[1]);fields=r.get_fields();widgets=[a.get_object() for a in r.pages[0]['/Annots']]
def name(w):
    parts=[]
    while w:
        if '/T' in w:parts.insert(0,str(w['/T']))
        w=w['/Parent'].get_object() if '/Parent' in w else None
    return '.'.join(parts)
def value(w):
    while w:
        if '/V' in w:return str(w['/V'])
        w=w['/Parent'].get_object() if '/Parent' in w else None
    return ''
assert len(widgets)==128
assert len({name(w) for w in widgets})==128
for w in widgets:
    n=name(w);assert n in fields,n
    assert value(w)==str(fields[n].get('/V','')),(n,value(w))
    assert w.get('/AP') and w['/AP'].get('/N'),n
    if w.get('/AS'):assert str(w['/AS'])==value(w),(n,str(w['/AS']),value(w))
print('All 128 canonical/widget values, states and appearances agree.')
