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
  assert.deepEqual(calculate('caffeine',{dose:100,hours:0}).data,{low:100,high:100});
  assert.equal(calculate('fatigue',fixtures.fatigue).data.reviewLoad,true);assert.equal(calculate('fatigue',{...fixtures.fatigue,days:1}).data.reviewLoad,false);
});
test('decision tools reject impossible counts and preserve literal user text',()=>{
  assert.ok(Math.abs(calculate('adherence',fixtures.adherence).data.percent-71.42857142857143)<1e-10);
  assert.throws(()=>calculate('adherence',{planned:7,done:8}));assert.throws(()=>calculate('adherence',{planned:7.5,done:3}));
  assert.equal(calculate('friction',fixtures.friction).data.lever,'environment');
  assert.equal(calculate('friction',{time:5,environment:5,complexity:5}).data.lever,'time');
  const literal='<img src=x onerror=alert(1)>';assert.equal(calculate('minimum',{action:literal,minutes:5}).data.action,literal);
});

