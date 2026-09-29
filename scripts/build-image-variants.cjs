const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const htmlFile = path.join(root, 'index.html');
let html = fs.readFileSync(htmlFile, 'utf8');
const variants = [];

html = html.replace(/<img\b[^>]*>/gs, tag => {
  const srcMatch = tag.match(/\bsrc="([^"]+)"/);
  if (!srcMatch || !srcMatch[1].startsWith('assets/media/')) return tag;
  const src = srcMatch[1];
  const source = path.join(root, src);
  const [width, height] = execFileSync('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=s=x:p=0',source], {encoding:'utf8'}).trim().split('x').map(Number);
  const candidates = [];
  for (const targetWidth of [320,640,1024]) {
    if (width <= targetWidth) continue;
    const variant = src.replace(/\.webp$/i, `-${targetWidth}w.webp`);
    const output = path.join(root, variant);
    if (!fs.existsSync(output)) execFileSync('ffmpeg', ['-y','-i',source,'-vf',`scale=${targetWidth}:-2`,'-c:v','libwebp','-quality','78','-compression_level','6',output], {stdio:'ignore'});
    candidates.push({path:variant,width:targetWidth});
    variants.push({path:variant,width:targetWidth});
  }
  candidates.push({path:src,width});
  candidates.sort((a,b)=>a.width-b.width);
  const srcset = candidates.map(item=>`${item.path} ${item.width}w`).join(', ');
  const logo = /02-11-TMR1hPHv/.test(src);
  const sizes = logo ? '180px' : '(max-width: 768px) 100vw, 50vw';
  let updated = tag.replace(/\bsrc="[^"]+"/, match=>`${match} srcset="${srcset}" sizes="${sizes}"`);
  if (!/\bwidth=/.test(updated)) updated=updated.replace(/\bsrc="[^"]+"/, match=>`${match} width="${width}" height="${height}"`);
  return updated;
});

fs.writeFileSync(htmlFile,html);
const manifestFile=path.join(root,'assets','media','image-manifest.json');
const current=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const byPath=new Map(current.map(item=>[item.path,item]));
for(const item of variants){
  const file=path.join(root,item.path);
  const [width,height]=execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=s=x:p=0',file],{encoding:'utf8'}).trim().split('x').map(Number);
  byPath.set(item.path,{path:item.path,width,height});
}
fs.writeFileSync(manifestFile,JSON.stringify([...byPath.values()],null,2)+'\n');
console.log(`Built ${variants.length} responsive WebP variants.`);
