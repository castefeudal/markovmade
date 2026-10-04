const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const server = process.env.BASE_URL ? null : spawn(process.execPath, [path.join(__dirname,'serve.cjs')], { cwd:root, stdio:['ignore','pipe','inherit'], env:process.env });
const outputDir=path.join(root,'test-results','lighthouse');fs.mkdirSync(outputDir,{recursive:true});
const bin=path.join(root,'node_modules','lighthouse','cli','index.js');
const categories=['performance','accessibility','best-practices','seo'];
// The product goal is 100 in every category. A bounded Performance CI floor
// handles host variance; every score below 100 remains explicit in the report.
const thresholds={performance:95,accessibility:100,'best-practices':100,seo:100};
function waitReady(){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Static server did not start')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Static QA server ready')){clearTimeout(timer);resolve();}});server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Static server exited (${code})`));});});}
async function runProfile(profile,url,name){
  const json=path.join(outputDir,name);
  const args=[bin,url,'--output=json',`--output-path=${json}`,'--only-categories='+categories.join(','),'--quiet','--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu','--no-enable-error-reporting'];
  if(profile==='desktop')args.push('--preset=desktop');
  const candidates=[process.env.CHROME_PATH,process.platform==='linux'?'/usr/bin/google-chrome':null,chromium.executablePath()].filter((value,index,all)=>value&&fs.existsSync(value)&&all.indexOf(value)===index);
  let lastError;
  for(const chromePath of candidates){
    try{
      await new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,CHROME_PATH:chromePath},stdio:'inherit'});
        child.once('error',reject);
        child.once('exit',code=>code===0?resolve():reject(new Error(`Lighthouse ${profile} exited ${code} with ${chromePath}`)));
      });
      return json;
    }catch(error){lastError=error;console.warn(error.message);}
  }
  throw lastError||new Error('No Chrome executable found for Lighthouse');
}
(async()=>{
  let failed=false;const summaries=[];
  try {
    if(server)await waitReady();
    // Cold SITE resources remain cold. Warm only the freshly installed browser
    // process/font infrastructure, so its one-time setup is not charged to URL 1.
    const executable=[process.env.CHROME_PATH,process.platform==='linux'?'/usr/bin/google-chrome':null,chromium.executablePath()].find(file=>file&&fs.existsSync(file));
    const warmup=await chromium.launch({executablePath:executable,headless:true});
    try{const blank=await warmup.newPage();await blank.goto('about:blank');await blank.setContent('<p style="font:16px Arial,sans-serif">Browser readiness · ABC 123 · АБВ</p>');await blank.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}finally{await warmup.close();}
    const scenes=process.env.LIGHTHOUSE_MATRIX?['ru','en'].flatMap(lang=>['aurum-noir','event-horizon','clarity'].map(theme=>({lang,theme}))):[null];
    const runs=Number(process.env.LIGHTHOUSE_RUNS||1);
    for(let run=1;run<=runs;run++)for(const scene of scenes)for(const profile of ['mobile','desktop']) {
      const url=new URL(process.env.BASE_URL||`http://127.0.0.1:${process.env.PORT||4173}/`);
      if(scene){url.searchParams.set('lang',scene.lang);url.searchParams.set('theme',scene.theme);}
      const name=(scene?`${scene.lang}-${scene.theme}-`:'')+profile+(runs>1?`-${run}`:'');
      const report=JSON.parse(fs.readFileSync(await runProfile(profile,url.href,name),'utf8'));
      const scores=Object.fromEntries(categories.map(k=>[k,Math.round((report.categories[k]?.score??0)*100)]));
      console.log(`Lighthouse ${name}: ${JSON.stringify(scores)}`);
      for(const [category,min]of Object.entries(thresholds))if(scores[category]<min)failed=true;
      const metrics=Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift'].map(k=>[k,report.audits[k].numericValue]));
      console.log(`  ${JSON.stringify(metrics)}`);
      if(Object.values(scores).some(score=>score<100))console.warn(`  100/100 goal remains open for ${name}; see the saved audit, not just the CI floor.`);
      summaries.push({name,url:url.href,lighthouseVersion:report.lighthouseVersion,scores,metrics,remainingAudits:Object.values(report.audits).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,detail:a.displayValue,savings:a.metricSavings}))});
    }
  }catch(error){console.error(error);process.exitCode=1;}
  finally{server?.kill();fs.writeFileSync(path.join(outputDir,'summary.json'),JSON.stringify(summaries,null,2));}
  if(failed){console.error('Lighthouse quality floors were not met.');process.exitCode=1;}
})();
