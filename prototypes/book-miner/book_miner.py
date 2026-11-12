import sys,re,json
from pathlib import Path

def read(p:Path):
    if p.suffix.lower() in {'.txt','.md'}:
        return p.read_text(encoding='utf-8',errors='ignore')
    if p.suffix.lower()=='.docx':
        from docx import Document
        return '\n'.join(x.text for x in Document(p).paragraphs)
    if p.suffix.lower()=='.pdf':
        from pypdf import PdfReader
        return '\n'.join((x.extract_text() or '') for x in PdfReader(p).pages)
    raise SystemExit('Supported: .txt .md .docx .pdf')

def main():
    p=Path(sys.argv[1]); text=read(p)
    paras=[re.sub(r'\s+',' ',x).strip() for x in re.split(r'\n\s*\n',text) if len(x.strip())>80]
    chunks=[]; buf=''
    for para in paras:
        if len(buf)+len(para)>4500 and buf:
            chunks.append(buf); buf=''
        buf+=(('\n\n' if buf else '')+para)
    if buf: chunks.append(buf)
    out={'source':p.name,'characters':len(text),'chunks':len(chunks),'items':[{'id':i+1,'text':x} for i,x in enumerate(chunks)]}
    Path(p.stem+'_chunks.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Created {p.stem}_chunks.json: {len(chunks)} chunks')

if __name__=='__main__': main()
