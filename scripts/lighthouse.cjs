const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const server = spawn(process.execPath, [path.join(__dirname,'serve.cjs')], { cwd:root, stdio:['ignore','pipe','inherit'], env:process.env });
const outputDir=path.join(root,'test-results','lighthouse');fs.mkdirSync(outputDir,{recursive:true});
const bin=path.join(root,'node_modules','lighthouse','cli','index.js');
const categories=['performance','accessibility','best-practices','seo'];
const thresholds={performance:90,accessibility:95,'best-practices':95,seo:95};
function waitReady(){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Static server did not start')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Static QA server ready')){clearTimeout(timer);resolve();}});server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Static server exited (${code})`));});});}
async function runProfile(profile){
  const json=path.join(outputDir,profile);
  const args=[bin,`http://127.0.0.1:${process.env.PORT||4173}/`,'--output=json',`--output-path=${json}`,'--only-categories='+categories.join(','),'--quiet','--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu','--no-enable-error-reporting'];
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
(async()=>{let failed=false;try{await waitReady();for(const profile of ['mobile','desktop']){const reportPath=await runProfile(profile),report=JSON.parse(fs.readFileSync(reportPath,'utf8'));console.log(`Lighthouse ${profile}:`);for(const [name,min]of Object.entries(thresholds)){const score=Math.round((report.categories[name]?.score??0)*100);console.log(`  ${name}: ${score} (target ${min})`);if(score<min)failed=true;}const audits=report.audits;console.log(`  LCP: ${audits['largest-contentful-paint']?.displayValue||'n/a'} · INP: ${audits['interaction-to-next-paint']?.displayValue||'n/a'} · CLS: ${audits['cumulative-layout-shift']?.displayValue||'n/a'}`);}}catch(error){console.error(error);process.exitCode=1;}finally{server.kill();}if(failed){console.error('Lighthouse thresholds were not met.');process.exitCode=1;}})();
