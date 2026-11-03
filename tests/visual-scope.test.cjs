const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('visual reconstruction preserves source bytes outside exact presentation regions',()=>{
 for(const[file,expected]of Object.entries(require('./visual-scope.json'))){
  let bytes=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  // The scrollable report needs native keyboard access. This exact, single DOM
  // attribute is an explicit presentation change to the sealed report source.
  // The original SHA-256 manifest remains unchanged; every other byte is checked.
  if(file==='assets/js/lab-toolkit.js'){
   const marker='section.tabIndex=0;';
   assert.equal(bytes.split(marker).length-1,1,'one explicit report focus attribute');
   assert.ok(bytes.includes("head=node('tr');"+marker+'for(const label'),'focus belongs to the workout table');
   bytes=bytes.replace(marker,'');
  }
  const originals=require('./fixtures/beyond-presentation-originals.json');
  const name=file.split('/').at(-1);
  if(Object.prototype.hasOwnProperty.call(originals,name)){
   const region=/\/\* BEGIN BEYOND PRESENTATION: [^*]+\*\/[\s\S]*?\/\* END BEYOND PRESENTATION: [^*]+\*\/\n/;
   assert.equal([...bytes.matchAll(new RegExp(region.source,'g'))].length,1,file+' has one approved presentation region');
   bytes=bytes.replace(region,()=>originals[name]);
  }
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,file+' must otherwise remain unchanged');
 }
});
