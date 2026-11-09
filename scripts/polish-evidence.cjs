/* Compose reviewed real browser renders; does not generate interface artwork. */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'test-results/polish'),out=path.join(root,'docs/polish-evidence');
fs.mkdirSync(out,{recursive:true});
function ff(args){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});}
const themes=['aurum-noir','event-horizon','clarity'];
for(const lang of ['ru','en'])for(const theme of themes){
 const prefix=path.join(source,`after-${lang}-${theme}-1440`);
 ff(['-i',`${prefix}-hero.png`,'-i',`${prefix}-lab.png`,'-filter_complex','[0:v]scale=480:333[h];[1:v]crop=1440:441:0:104,scale=480:147[l];[h][l]vstack=inputs=2[v]','-map','[v]','-frames:v','1','-quality','82',path.join(root,'assets/media/theme-previews',`${theme}${lang==='en'?'-en':''}.webp`)]);
}
for(const width of [390,1440])for(const scene of ['hero','header','lab','os','services','contact','studio','os-filled','service-open']){
 const args=[],filters=[],small=width===390?240:480;
 for(const theme of themes)for(const stage of ['before','after'])args.push('-i',path.join(source,`${stage}-ru-${theme}-${width}-${scene}.png`));
 for(let i=0;i<6;i++)filters.push(`[${i}:v]scale=${small}:-1[s${i}]`);
 filters.push('[s0][s1]hstack[r0]','[s2][s3]hstack[r1]','[s4][s5]hstack[r2]','[r0][r1][r2]vstack=inputs=3[v]');
 const file=path.join(out,`${scene}-${width}.webp`);
 ff([...args,'-filter_complex',filters.join(';'),'-map','[v]','-frames:v','1','-quality','82',file]);
 if(['hero','lab','os'].includes(scene))ff(['-i',file,'-vf','format=gray','-frames:v','1','-quality','82',file.replace('.webp','-gray.webp')]);
}
