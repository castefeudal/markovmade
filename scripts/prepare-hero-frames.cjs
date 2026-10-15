/* Extract the authored poses once, at source resolution. Browsers can scrub
   these frames without depending on a hidden hardware video decoder. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),directory=path.join(root,'assets/media/hero-frames');
fs.mkdirSync(directory,{recursive:true});
const manifest={version:1,width:1600,height:1080,frames:{neutral:[],turn:[],nod1:[],nod2:[]},peak:{nod1:4,nod2:3}};
for(const [group,start,end,count]of [['neutral',.1,.1,1],['turn',.08,2.42,24],['nod1',2.72,4.58,8],['nod2',5.06,7.72,8]]) {
  for(let i=0;i<count;i++){
    const name=`${group}-${String(i).padStart(2,'0')}.webp`,time=count===1?start:start+(end-start)*i/(count-1);
    execFileSync('ffmpeg',['-y','-v','error','-ss',time.toFixed(6),'-i',path.join(root,'assets/media/hero-portrait.mp4'),'-frames:v','1','-c:v','libwebp','-quality','90','-compression_level','6',path.join(directory,name)]);
    manifest.frames[group].push(name);
  }
}
fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest)+'\n');
const sealPath=path.join(root,'tests/hero-crop.json'),seal=JSON.parse(fs.readFileSync(sealPath));
for(const name of fs.readdirSync(directory)){
  const file='assets/media/hero-frames/'+name;
  seal.assets[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
}
fs.writeFileSync(sealPath,JSON.stringify(seal,null,2)+'\n');
console.log('Prepared and sealed 41 native 1600 × 1080 hero frames.');
