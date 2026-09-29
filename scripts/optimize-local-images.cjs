const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const htmlFile = path.join(root, 'index.html');
const mediaRoot = path.join(root, 'assets', 'media', 'portfolio');
const html = fs.readFileSync(htmlFile, 'utf8');
const referenced = [...new Set([...html.matchAll(/assets\/media\/portfolio\/[^\s"'<>]+/g)].map(match => match[0]))];
const optimized = new Map();
const metadata = new Map();
for (const relative of referenced) {
  const source = path.join(root, relative);
  const extension = path.extname(source).toLowerCase();
  if (!fs.existsSync(source)) throw new Error(`Missing referenced image: ${relative}`);
  let output = source;
  if (extension !== '.webp') {
    output = source.slice(0, -extension.length) + '.webp';
    if (!fs.existsSync(output)) execFileSync('ffmpeg', ['-y', '-i', source, '-vf', 'scale=min(1600\\,iw):-2', '-c:v', 'libwebp', '-quality', '78', '-compression_level', '6', output], { stdio: 'ignore' });
    optimized.set(relative, output.slice(root.length + 1).replace(/\\/g, '/'));
  }
  const details = execFileSync('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=s=x:p=0',output], { encoding:'utf8' }).trim().split('x').map(Number);
  metadata.set(relative, { path: output.slice(root.length + 1).replace(/\\/g, '/'), width: details[0], height: details[1] });
}
let updated = html;
for (const [from, to] of optimized) updated = updated.split(from).join(to);
updated = updated.replace(/<img\b[^>]*>/gs, tag => {
  const src = tag.match(/\bsrc="([^"]+)"/);
  if (!src) return tag;
  const original = [...metadata.keys()].find(key => key === src[1]) || [...metadata.keys()].find(key => optimized.get(key) === src[1]);
  const info = original && metadata.get(original);
  if (!info || /\bwidth=/.test(tag)) return tag;
  return tag.replace(/\bsrc="[^"]+"/, match => `${match} width="${info.width}" height="${info.height}"`);
});
updated = updated.replace(/https:\/\/i\.ibb\.co[^\s"']*/g, 'https://castefeudal.github.io/markovmade/assets/media/portfolio/01-11-20Z6SwTz.webp');
updated = updated.replaceAll('https://castefeudal.github.io/markovmade/assets/media/portfolio/04-1-XkjZ4N71.webp','https://castefeudal.github.io/markovmade/assets/media/portfolio/01-11-20Z6SwTz.webp');
fs.writeFileSync(htmlFile, updated);
const keep = new Set([...metadata.values()].map(item => path.basename(item.path)));
for (const entry of fs.readdirSync(mediaRoot)) {
  if (entry.endsWith('.webp') && !keep.has(entry)) fs.rmSync(path.join(mediaRoot, entry));
  else if (/\.(png|jpe?g)$/i.test(entry)) fs.rmSync(path.join(mediaRoot, entry));
}
fs.writeFileSync(path.join(root,'assets','media','image-manifest.json'), JSON.stringify([...metadata.values()].map(item => ({path:item.path,width:item.width,height:item.height})),null,2)+'\n');
console.log(`Optimized ${metadata.size} referenced local image assets.`);
