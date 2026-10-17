const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');const seal=require('./authored-copy.json');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
test('all authored text nodes and RU/EN dictionaries survive the experience rebuild',async()=>{
 for(const[file,expected]of Object.entries(seal.translations))assert.equal(hash(fs.readFileSync(file)),expected,file);
 const browser=await chromium.launch();try{const page=await browser.newPage();for(const[file,expected]of Object.entries(seal.components)){
  const text=await page.evaluate(html=>{const t=document.createElement('template');t.innerHTML=html;const w=document.createTreeWalker(t.content,NodeFilter.SHOW_TEXT);let n;const out=[];while(n=w.nextNode()){if(n.parentElement?.closest('script,style'))continue;const v=n.nodeValue.replace(/\s+/g,' ').trim();if(v)out.push(v);}return out;},fs.readFileSync('src/components/'+file,'utf8'));
  const actual={};for(const value of text){const key=hash(value);actual[key]=(actual[key]||0)+1;}for(const[key,count]of Object.entries(expected))assert.ok((actual[key]||0)>=count,file+': protected authored text '+key+' is preserved');
 }}finally{await browser.close();}
});
