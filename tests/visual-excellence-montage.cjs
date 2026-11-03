const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root='test-results/visual-excellence',out=root+'/review';fs.mkdirSync(out,{recursive:true});
function files(dir,filter){return fs.readdirSync(dir).filter(filter).map(f=>path.join(dir,f));}
const sets={
 final:files(root+'/final',f=>f.endsWith('.png')),
 contracts:files('test-results/contracts',f=>/^(ru|en)-/.test(f)&&f.endsWith('.png')),
 states:files(root+'/states',f=>/^(ru|en)-.*-390-.*result\.png$/.test(f)),
 components:files(root+'/pass-3',f=>/^ru-.*-1440-.*\.png$/.test(f)),
 candidates:files('test-results/visual',f=>f.endsWith('.png'))
};
const manifest={};
for(const[name,paths]of Object.entries(sets))for(let n=0;n<paths.length;n+=9){
 const batch=paths.slice(n,n+9),sheet=new PNG({width:1200,height:1080});sheet.data.fill(45);
 for(let i=0;i<batch.length;i++){
  const src=PNG.sync.read(fs.readFileSync(batch[i])),scale=Math.min(392/src.width,352/src.height),w=Math.round(src.width*scale),h=Math.round(src.height*scale);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const from=(Math.min(src.height-1,Math.floor(y/scale))*src.width+Math.min(src.width-1,Math.floor(x/scale)))*4,to=((Math.floor(i/3)*360+y)*1200+i%3*400+x)*4;
   src.data.copy(sheet.data,to,from,from+4);
  }
 }
 const file=`${out}/${name}-${n/9}.png`;fs.writeFileSync(file,PNG.sync.write(sheet));manifest[file]=batch;
}
fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));
