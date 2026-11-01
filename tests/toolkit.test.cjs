const test=require('node:test'),assert=require('node:assert/strict');
const {calculate,definitions}=require('../assets/js/toolkit-models.js');
const fixtures=require('./toolkit-fixtures.json');
test('every added model produces bilingual result, uncertainty, action and evidence metadata',()=>{
  assert.equal(definitions.length,17);
  for(const definition of definitions){
    const result=calculate(definition.id,fixtures[definition.id]);
    for(const key of ['value','meaning','uncertainty','accuracy'])assert.ok(result[key].length===2&&result[key].every(value=>typeof value==='string'&&value.length>0),definition.id+' '+key);
    assert.ok(result.actions.length>=1&&result.actions.length<=3);assert.ok(['high','moderate','low'].includes(result.confidence));
    assert.ok(definition.formula&&definition.limits&&definition.version&&definition.review&&definition.type);
    assert.throws(()=>calculate(definition.id,{}),undefined,definition.id+' rejects absent inputs');
  }
});
test('body scenarios and circumference changes preserve mass arithmetic',()=>{
  const result=calculate('recomposition',fixtures.recomposition);assert.equal(result.data.weight,79);assert.ok(Math.abs(result.data.bodyFat-14/79*100)<1e-10);
  assert.equal(calculate('circumference',fixtures.circumference).data.weekly,-1);
  assert.throws(()=>calculate('recomposition',{...fixtures.recomposition,fatLoss:-20}));
});
test('protein and phase fixtures are explicit scenarios',()=>{
  assert.deepEqual(calculate('protein',fixtures.protein).data,{low:128,high:176});assert.equal(calculate('phase',fixtures.phase).data.weeks,10);
  assert.equal(calculate('phase',{...fixtures.phase,target:80}).data.weeks,0);
});
test('plate subset search handles non-greedy inventory and unreachable targets',()=>{
  const result=calculate('plates',fixtures.plates);assert.equal(result.data.achieved,67.5);assert.equal(result.data.plates.reduce((a,b)=>a+b,0)*2+20,67.5);
  assert.equal(calculate('plates',{target:32,bar:20,inventory:'4, 3, 3'}).data.achieved,32);
  assert.equal(calculate('plates',{target:31,bar:20,inventory:'4, 3, 3'}).data.achieved,28);
  assert.throws(()=>calculate('plates',{target:10,bar:20,inventory:'10'}));
});
test('training models do not prescribe progression from a single session',()=>{
  assert.equal(calculate('volume',fixtures.volume).data.tonnage,1440);
  assert.deepEqual(calculate('load',fixtures.load).data,{byPct:75,byRir:77.5,rpe:8});
  assert.equal(calculate('progression',fixtures.progression).data.next,62.5);
  assert.equal(calculate('progression',{...fixtures.progression,sessions:1}).data.next,60);
  assert.equal(calculate('progression',{...fixtures.progression,step:10}).data.next,60);
  assert.equal(calculate('cardio',fixtures.cardio).data.max,180);
});
test('working-load rounding never rounds above the selected reference and exposes unavailable increments',()=>{
  const edge={max:16,percent:95,reps:1,rir:0,step:10};
  assert.deepEqual(calculate('load',edge).data,{byPct:10,byRir:10,rpe:10});
  assert.deepEqual(calculate('load',{...edge,max:10,percent:30,reps:12,rir:5}).data,{byPct:null,byRir:null,rpe:5});
  for(const max of [10,16,33,100,253.5])for(const percent of [30,50,70,95])for(const step of [.5,2.5,5,10]){
    const r=calculate('load',{max,percent,step,reps:5,rir:2}).data;
    for(const [value,limit]of [[r.byPct,max*percent/100],[r.byRir,max/(1+7/30)]])if(value!==null){assert.ok(value>0&&value<=limit+1e-6);assert.ok(value<=max);}
  }
});
test('archived working-load 2.0 rounding remains reproducible',()=>{
  const r=calculate('load',{max:16,percent:95,reps:1,rir:0,step:10},'2.0.0');
  assert.equal(r.modelVersion,'2.0.0');assert.deepEqual(r.data,{byPct:20,byRir:20,rpe:10});assert.equal(calculate('load',fixtures.load,'2.0.0').data.byRir,80);
});
test('sleep handles midnight and caffeine retains uncertainty',()=>{
  assert.equal(calculate('sleep',fixtures.sleep).data.hours,7.5);
  assert.equal(calculate('sleep',{bed:'08:00',wake:'16:00',awake:0}).data.hours,8);
  assert.throws(()=>calculate('sleep',{bed:'25:00',wake:'07:00',awake:30}));
  const dose=calculate('caffeine',fixtures.caffeine).data;assert.ok(dose.low<dose.high);assert.ok(Math.abs(dose.low-15.7490131236859)<1e-10);
  assert.deepEqual(calculate('caffeine',{dose:100,hours:0},'2.0.0').data,{low:100,high:100});
  assert.equal(calculate('fatigue',fixtures.fatigue).data.reviewLoad,true);assert.equal(calculate('fatigue',{...fixtures.fatigue,days:1}).data.reviewLoad,false);
});
test('decision tools reject impossible counts and preserve literal user text',()=>{
  assert.ok(Math.abs(calculate('adherence',fixtures.adherence).data.percent-71.42857142857143)<1e-10);
  assert.throws(()=>calculate('adherence',{planned:7,done:8}));assert.throws(()=>calculate('adherence',{planned:7.5,done:3}));
  assert.equal(calculate('friction',fixtures.friction).data.lever,'environment');
  assert.equal(calculate('friction',{time:5,environment:5,complexity:5}).data.lever,'time');
  const literal='<img src=x onerror=alert(1)>';assert.equal(calculate('minimum',{action:literal,minutes:5}).data.action,literal);
});


test('progression requires explicit comparability and per-set volume sums different loads',()=>{
 assert.equal(calculate('progression',{...fixtures.progression,comparable:0}).data.increase,false);
 const {comparable,...old}=fixtures.progression;assert.equal(calculate('progression',old).data.increase,false);
 assert.deepEqual(calculate('volume',{...fixtures.volume,entries:'8 x 60; 7 x 62.5; 6 x 65'}).data,{tonnage:1307.5,repetitions:21});
 assert.throws(()=>calculate('volume',{...fixtures.volume,entries:'8 x 60; invalid'}));
});

test('old model snapshots remain reproducible without changing current progression safety',()=>{
 const {comparable,...old}=fixtures.progression;
 const previous=calculate('progression',old,'2.0.0');assert.equal(previous.data.next,62.5);assert.equal(previous.modelVersion,'2.0.0');
 const current=calculate('progression',old);assert.equal(current.data.next,60);assert.equal(current.modelVersion,'2.2.0');
 assert.equal(calculate('volume',{...fixtures.volume,entries:'1 x 10'},'2.0.0').data.tonnage,1440);
});

test('professional plate options include collars and nearest heavier comparison',()=>{
  const model=calculate('plates',{target:32,bar:20,collars:2,inventory:'5,3,2'});
  assert.equal(model.modelVersion,'2.3.0');
  assert.equal(model.data.achieved,32);
  assert.equal(model.data.exact,true);
  assert.equal(model.data.bar+model.data.collars+model.data.perSide*2,model.data.achieved);
  const near=calculate('plates',{target:31,bar:20,collars:0,inventory:'4,3,3'});
  assert.equal(near.data.achieved,28);assert.equal(near.data.above,32);
  assert.equal(calculate('plates',{target:31,bar:20,inventory:'4,3,3'},'2.0.0').data.above,undefined);
  assert.throws(()=>calculate('plates',{target:19,bar:20,collars:2,inventory:'5'}));
});
test('multi-dose caffeine correctly sums independent inputs while old snapshots remain stable',()=>{
  const inputs={dose:100,hours:8,extra:'100@12; 50@4'},value=calculate('caffeine',inputs);
  assert.equal(value.modelVersion,'2.3.0');assert.equal(value.data.totalDose,250);
  for(const scenario of value.data.scenarios){
    const reference=100*2**(-8/scenario.halfLife)+100*2**(-12/scenario.halfLife)+50*2**(-4/scenario.halfLife);
    assert.ok(Math.abs(scenario.remaining-reference)<1e-9);
  }
  assert.equal(calculate('caffeine',inputs,'2.0.0').modelVersion,'2.0.0');
  assert.equal(calculate('caffeine',inputs,'2.0.0').data.low,100*2**(-8/3));
  assert.throws(()=>calculate('caffeine',{dose:100,hours:8,extra:'invalid'}));
  assert.throws(()=>calculate('caffeine',{dose:100,hours:8,extra:'100@50'}));
});
test('plate search matches exhaustive subsets including microplates, ties and empty inventory',()=>{
 let seed=17;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let trial=0;trial<120;trial++){
  const inventory=Array.from({length:1+Math.floor(rand()*8)},()=>[.125,.25,.5,1,1.25,2.5,3,4][Math.floor(rand()*8)]),target=20+rand()*25;
  const sums=[];for(let mask=0;mask<2**inventory.length;mask++){let sum=0,count=0;for(let i=0;i<inventory.length;i++)if(mask&(1<<i)){sum+=inventory[i];count++;}sums.push({total:20+sum*2,count});}
  const lower=Math.max(...sums.filter(s=>s.total<=target+1e-8).map(s=>s.total)),upper=Math.min(...sums.filter(s=>s.total>=target-1e-8).map(s=>s.total)),r=calculate('plates',{target,bar:20,inventory:inventory.join(';')}).data;
  assert.equal(r.achieved,lower);assert.equal(r.above,Number.isFinite(upper)?upper:null);assert.equal(r.plates.length,Math.min(...sums.filter(s=>s.total===lower).map(s=>s.count)));assert.equal(20+2*r.plates.reduce((a,b)=>a+b,0),r.achieved);
  const remaining=inventory.slice();for(const plate of r.plates){const index=remaining.indexOf(plate);assert.ok(index>=0);remaining.splice(index,1);}
 }
 const empty=calculate('plates',{target:30,bar:20,collars:2,inventory:''}).data;assert.equal(empty.achieved,22);assert.equal(empty.above,null);
 assert.equal(calculate('plates',{target:25,bar:20,inventory:'2,5'}).data.achieved,25);assert.equal(calculate('plates',{target:27.5,bar:20,inventory:'2,5; 1,25'}).data.achieved,27.5);
});
test('clock-time caffeine uses entered sources only and exposes a hypothetical timeline',()=>{
 const v={bedtime:'23:00',intakes:JSON.stringify([{source:'Coffee',dose:100,time:'15:00'},{source:'Tea',dose:50,time:'19:00'}])},r=calculate('caffeine',v);
 for(const scenario of r.data.scenarios)assert.ok(Math.abs(scenario.remaining-(100*2**(-8/scenario.halfLife)+50*2**(-4/scenario.halfLife)))<1e-9);
 assert.equal(r.data.totalDose,150);assert.equal(r.data.timeline.length,3);assert.ok(r.data.earlierScenarios[1].remaining<r.data.scenarios[1].remaining);
 const midnight=calculate('caffeine',{bedtime:'01:00',intakes:JSON.stringify([{source:'Tea',dose:50,time:'23:00'}])});assert.equal(midnight.data.doses[0].hours,2);
 assert.throws(()=>calculate('caffeine',{...v,bedtime:''}));assert.throws(()=>calculate('caffeine',{...v,intakes:'[{"source":"Tea","dose":null,"time":"19:00"}]'}));
 const literal='<img src=x onerror=alert(1)>';assert.equal(calculate('caffeine',{bedtime:'23:00',intakes:JSON.stringify([{source:literal,dose:50,time:'19:00'}])}).data.doses[0].source,literal);
});
test('all archived PRO runners preserve their model version and prior interpretation',()=>{
 assert.equal(calculate('plates',{target:25,bar:20,inventory:'2,5'},'2.2.0').data.achieved,24);
 assert.equal(calculate('caffeine',{dose:100,hours:8,extra:'50@4'},'2.2.0').modelVersion,'2.2.0');
 assert.equal(calculate('progression',fixtures.progression,'2.1.0').modelVersion,'2.1.0');
 const records=JSON.stringify([{exercise:'bench',load:60,reps:10,sets:3,rir:2,technique:'same',rom:'full',rest:180},{exercise:'bench',load:60,reps:10,sets:3,rir:2,technique:'same',rom:'full',rest:180}]);
 assert.equal(calculate('progression',{records,step:2.5,ceiling:10}).data.next,62.5);
});
