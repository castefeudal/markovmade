const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../assets/js/lab-models.js');
test('decimal-comma observations preserve one measurement and reject ambiguous input',()=>{
 assert.deepEqual(m.parseWeightObservations('106,5\n106.2; 106,1').values,[106.5,106.2,106.1]);
 for(const raw of ['106,5,106,2','106 garbage','NaN','Infinity','0','-80','2026-02-30=80','2026-01-01=80;2026-01-01=81'])assert.throws(()=>m.parseWeightObservations(raw));
 const x=m.parseWeightObservations('2026-01-08=79,5;2026-01-01=80');
 assert.deepEqual(x.values,[80,79.5]);assert.equal(x.days[1]-x.days[0],7);
 assert.deepEqual(m.parseWeightObservations(''),{values:[],days:[],dates:[]});
});
test('nutrition propagates expenditure sensitivity rather than inventing a target confidence band',()=>{
 const x=m.nutritionTarget(2500,2250,2750,.9);
 assert.equal(x.target,2250);assert.equal(x.targetLow,2025);assert.equal(x.targetHigh,2475);assert.equal(x.intervalType,'scenario');
 for(const args of [[NaN,1,2,1],[2500,2600,2700,1],[2500,2000,2300,1],[2500,2250,2750,-1]])assert.throws(()=>m.nutritionTarget(...args));
});
test('macronutrients always conserve energy including low calories and fat preferences',()=>{
 for(const energy of [1500,2000,3000])for(const share of [.2,.25,.35]){
  const x=m.macroAllocation(energy,128,48,share);
  assert.ok(x.fat>=48);assert.ok(x.carbs>=0);assert.ok(Math.abs(x.macroCalories-energy)<1e-9);
 }
 assert.throws(()=>m.macroAllocation(1000,200,60));assert.throws(()=>m.macroAllocation(Infinity,100,40));
 const fixture=m.macroAllocation(2000,128,48,.25);assert.equal(fixture.protein,128);assert.ok(Math.abs(fixture.fat-500/9)<1e-9);assert.equal(fixture.carbs,247);
});
test('calendar windows reject normalized impossible dates without changing source records',()=>{
 const rows=[{date:'2026-02-30',weight:80},{date:'2026-03-01',weight:81}];
 const saved=JSON.stringify(rows);const x=m.checkinTrends(rows,7,new Date('2026-03-04T12:00:00'));
 assert.equal(x.count,1);assert.equal(JSON.stringify(rows),saved);
});
test('recovery baselines require distinct valid dated days and sustained signals need three consecutive observations',()=>{
 const date=i=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10);
 const baseline=Array.from({length:14},(_,i)=>({date:date(i),rhr:60,hrv:50}));
 assert.equal(m.personalRecoveryBaseline(Array(14).fill(baseline[0])).ready,false);
 assert.equal(m.personalRecoveryBaseline(baseline).ready,true);
 const recent=Array.from({length:3},(_,i)=>({date:date(14+i),rhr:70,hrv:35}));
 assert.deepEqual(m.sustainedRecoverySignals([...baseline,...recent]).signals,['rhr-elevated','hrv-reduced']);
 assert.deepEqual(m.sustainedRecoverySignals([...baseline,...recent.slice(0,1)]).signals,[]);
 recent[1].date=date(30);assert.equal(m.sustainedRecoverySignals([...baseline,...recent]).ready,false);
});
test('observed low calorie days are preserved, distinct from the supported calibration target range',()=>{
 const days=Array.from({length:14},(_,i)=>({date:new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10),weight:80,calories:i===0?0:2600,adherence:90}));
 const x=m.dailyCalibration(days,new Date('2026-10-14T12:00:00'));
 assert.equal(x.ready,true);assert.equal(x.count,14);assert.equal(x.sample[0].calories,0);assert.equal(x.averageCalories,2600*13/14);
 days.forEach(day=>day.calories=500);const low=m.dailyCalibration(days,new Date('2026-10-14T12:00:00'));
 assert.equal(low.ready,false);assert.equal(low.reason,'calories');assert.equal(low.sample.length,14);
});
test('scientific dynamic outputs translate numerical scenarios in English and preserve Russian originals',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const document={documentElement:{lang:'en'},addEventListener(){}};
 const window={mmSafeStorage:{get:()=>document.documentElement.lang}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/dynamic-copy.js'),'utf8'),{window,document});
 const inputs=[
  'Стартовое распределение: белок 128 г, жиры 56 г, углеводы 247 г. Оно согласовано с калорийностью; верхняя граница белкового диапазона не обязательна.',
  'указанный пользователем ориентир поддержания · сценарий ±15%, не измерение',
  'RHR выше личной медианы минимум на 10% три дня подряд'
 ];
 for(const source of inputs)assert.doesNotMatch(window.__mmDynamicTranslate(source),/[А-Яа-яЁё]/);
 document.documentElement.lang='ru';for(const source of inputs)assert.equal(window.__mmDynamicTranslate(source),source);
});
