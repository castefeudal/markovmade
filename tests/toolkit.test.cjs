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
  assert.deepEqual(calculate('load',fixtures.load).data,{byPct:75,byRir:80,rpe:8});
  assert.equal(calculate('progression',fixtures.progression).data.next,62.5);
  assert.equal(calculate('progression',{...fixtures.progression,sessions:1}).data.next,60);
  assert.equal(calculate('progression',{...fixtures.progression,step:10}).data.next,60);
  assert.equal(calculate('cardio',fixtures.cardio).data.max,180);
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
 const current=calculate('progression',old);assert.equal(current.data.next,60);assert.equal(current.modelVersion,'2.1.0');
 assert.equal(calculate('volume',{...fixtures.volume,entries:'1 x 10'},'2.0.0').data.tonnage,1440);
});

test('professional plate options include collars and nearest heavier comparison',()=>{
  const model=calculate('plates',{target:32,bar:20,collars:2,inventory:'5,3,2'});
  assert.equal(model.modelVersion,'2.2.0');
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
  assert.equal(value.modelVersion,'2.2.0');assert.equal(value.data.totalDose,250);
  for(const scenario of value.data.scenarios){
    const reference=100*2**(-8/scenario.halfLife)+100*2**(-12/scenario.halfLife)+50*2**(-4/scenario.halfLife);
    assert.ok(Math.abs(scenario.remaining-reference)<1e-9);
  }
  assert.equal(calculate('caffeine',inputs,'2.0.0').modelVersion,'2.0.0');
  assert.equal(calculate('caffeine',inputs,'2.0.0').data.low,100*2**(-8/3));
  assert.throws(()=>calculate('caffeine',{dose:100,hours:8,extra:'invalid'}));
  assert.throws(()=>calculate('caffeine',{dose:100,hours:8,extra:'100@50'}));
});
