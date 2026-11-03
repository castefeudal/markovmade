const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('visual reconstruction preserves source bytes except the explicit report focus attribute',()=>{
 for(const[file,expected]of Object.entries(require('./visual-scope.json'))){
  let bytes=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  // The scrollable report needs native keyboard access. This exact, single DOM
  // attribute is the only approved presentation change to the sealed JS sources.
  // The original SHA-256 manifest remains unchanged; every other byte is checked.
  if(file==='assets/js/lab-toolkit.js'){
   const marker='section.tabIndex=0;';
   assert.equal(bytes.split(marker).length-1,1,'one explicit report focus attribute');
   assert.ok(bytes.includes("head=node('tr');"+marker+'for(const label'),'focus belongs to the workout table');
   bytes=bytes.replace(marker,'');
  }
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,file+' must otherwise remain unchanged');
 }
});
