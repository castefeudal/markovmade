/* Pixel-level WCAG contrast audit.
   axe reports "incomplete" for text over gradients and photography because it cannot
   resolve the painted background. This samples the real rendered pixels instead:
   for every visible text run the background is the median of the non-ink pixels inside
   its own box, and the ratio is computed against the colour actually painted there.
   Measurement and capture happen in the same frame at the same scroll offset, so the
   sampled pixels always belong to the run being judged. */
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..');
const out=path.join(repo,'test-results','contrast');fs.mkdirSync(out,{recursive:true});
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const {startServer}=require('../tests/browser-helpers.cjs');

const theme=process.argv[2]||'aurum-noir';
const width=+(process.argv[3]||1440);
const height=+(process.argv[4]||900);

function lum([r,g,b]){const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)}
function ratio(a,b){const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}
function parseRGB(s){const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(Number);return {rgb:[p[0],p[1],p[2]],a:p.length>3?p[3]:1}}
const dist=(p,q)=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]);

const MEASURE=`(() => {
  const rows=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode())){
    const text=(n.nodeValue||'').trim();if(!text)continue;
    const el=n.parentElement;if(!el)continue;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<.2)continue;
    const range=document.createRange();range.selectNodeContents(n);
    const rects=[...range.getClientRects()].filter(r=>r.width>3&&r.height>Math.max(6,parseFloat(cs.fontSize)*0.5));
    for(const r of rects){
      if(r.top<2||r.bottom>innerHeight-2||r.left<0||r.right>innerWidth)continue;
      // A run painted by something else (sticky chrome, overlay) would be scored against
      // the wrong pixels, so keep only runs whose own box is the topmost thing there.
      const cx=Math.round(r.left+r.width/2),cy=Math.round(r.top+r.height/2);
      const top=document.elementFromPoint(cx,cy);
      if(!top||!(top===el||el.contains(top)||top.contains(el)))continue;
      rows.push({key:el.tagName+'|'+(el.className&&el.className.toString().slice(0,40))+'|'+text.slice(0,24)+'|'+Math.round(r.left)+','+Math.round(r.top),
        tag:el.tagName.toLowerCase(),cls:(el.className?el.className.toString():'').split(' ')[0].slice(0,40),id:el.id||'',
        text:text.slice(0,42),color:cs.color,fontSize:parseFloat(cs.fontSize),fontWeight:parseInt(cs.fontWeight,10)||400,
        rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]});
      break;
    }
  }
  return rows;
})()`;

(async()=>{
  const server=await startServer();const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
    await page.goto(server.url+'/?lang=ru',{waitUntil:'load'});
    await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
    await page.evaluate(()=>Promise.all([window.mmLoadLab(),window.mmLoadOS(),window.mmLoadContent()]));
    await page.addStyleTag({content:'html{scroll-behavior:auto !important}section{content-visibility:visible !important;contain-intrinsic-size:none !important}*{animation:none !important;transition:none !important}.fade-in-up{transform:none !important;opacity:1 !important}'});
    await page.evaluate(async()=>{
      const step=Math.round(innerHeight*0.7);
      for(let y=0;y<document.documentElement.scrollHeight;y+=step){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}
      window.scrollTo(0,0);
      await Promise.all([...document.images].map(img=>img.complete?0:new Promise(r=>{img.onload=img.onerror=r;setTimeout(r,3000)})));
      await document.fonts.ready;
    });
    await page.waitForTimeout(600);
    const seen=new Map();
    const total=await page.evaluate(()=>document.documentElement.scrollHeight);
    for(let y=0;y<total;y+=Math.round(height*0.7)){
      await page.evaluate(v=>window.scrollTo(0,v),y);
      await page.waitForFunction(v=>Math.abs(window.scrollY-v)<1,y,{timeout:3000}).catch(()=>{});
      await page.waitForTimeout(120);
      const shot=PNG.sync.read(await page.screenshot({fullPage:false}));
      const rows=await page.evaluate(MEASURE);
      if(process.env.DEBUG){
        fs.writeFileSync(path.join(out,'shots','contrast-step.png'),PNG.sync.write(shot));
        const probe=rows.slice(0,4);
        for(const r of probe){
          const [px,py]= [r.rect[0]+Math.round(r.rect[2]/2), r.rect[1]+Math.round(r.rect[3]/2)];
          const at=(x,y)=>{const i=(y*shot.width+x)*4;return [shot.data[i],shot.data[i+1],shot.data[i+2]].join(',')};
          console.log(`DBG scroll=${await page.evaluate(()=>Math.round(window.scrollY))} ${r.text} rect=${r.rect.join(',')} color=${r.color} centerPx=${at(px,py)} rowPx=${at(r.rect[0]+2,py)}`);
        }
        console.log('DBG shot size',shot.width,'x',shot.height,'saved contrast-step.png');
        process.exit(0);
      }
      for(const row of rows){
        if(seen.has(row.key))continue;
        const fg=parseRGB(row.color);if(!fg||fg.a<.9)continue;
        const [x,ry,w,h]=row.rect;
        const samples=[];
        for(let py=ry;py<Math.min(ry+h,shot.height);py++){
          for(let px=x;px<Math.min(x+w,shot.width);px++){
            const i=(py*shot.width+px)*4;
            samples.push([shot.data[i],shot.data[i+1],shot.data[i+2]]);
          }
        }
        if(samples.length<20)continue;
        // The declared colour is the ink; the box only tells us what is painted behind it.
        // A usable reading needs both populations: pixels that match the ink and pixels
        // that clearly do not. A box that is one uniform colour is not the run we measured.
        const near=samples.filter(p=>dist(p,fg.rgb)<=60);
        const far=samples.filter(p=>dist(p,fg.rgb)>120);
        if(near.length/samples.length<0.02||far.length/samples.length<0.05)continue;
        const ink=fg.rgb;
        const med=idx=>far.map(p=>p[idx]).sort((a,b)=>a-b)[Math.floor(far.length/2)];
        const bg=[med(0),med(1),med(2)];
        const r=ratio(ink,bg);
        const large=row.fontSize>=24||(row.fontSize>=18.66&&row.fontWeight>=700);
        seen.set(row.key,{...row,ratio:+r.toFixed(2),required:large?3:4.5,ink:`rgb(${ink.join(',')})`,bg:`rgb(${bg.join(',')})`});
      }
    }
    const results=[...seen.values()];
    const failing=results.filter(x=>x.ratio<x.required).sort((a,b)=>a.ratio-b.ratio);
    fs.writeFileSync(path.join(out,`contrast-${theme}-${width}.json`),JSON.stringify({theme,width,checked:results.length,failing:failing.length,worst:results.sort((a,b)=>a.ratio-b.ratio).slice(0,80)},null,1));
    console.log(`${theme} @${width}: ${results.length} text runs measured, ${failing.length} below AA.`);
    console.log('  <3:1 =',results.filter(x=>x.ratio<3).length,' 3:1-4.5 =',results.filter(x=>x.ratio>=3&&x.ratio<4.5).length,'  ok =',results.filter(x=>x.ratio>=x.required).length);
    for(const f of failing.slice(0,30))console.log(`  ${f.ratio.toFixed(2)} (need ${f.required}) ${f.fontSize}px/${f.fontWeight} <${f.tag}${f.id?'#'+f.id:'.'+f.cls}> "${f.text}" ink=${f.ink} bg=${f.bg}`);
  }catch(e){console.error('FAILED',e.message)}finally{await browser.close();await server.close()}
})();
