const test=require('node:test'),assert=require('node:assert/strict'),m=require('../assets/js/lab-models.js');
const anchor=new Date('2026-10-17T12:00:00');
const day=i=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10);
test('daily calibration never substitutes unknown adherence',()=>{
 const records=Array.from({length:14},(_,i)=>({date:day(i),weight:80-i*.04,calories:2700}));
 const result=m.dailyCalibration(records,anchor);assert.equal(result.ready,false);assert.equal(result.reason,'adherence');assert.equal(result.adherenceCount,0);
 records.forEach(x=>x.adherence=90);assert.equal(m.dailyCalibration(records,anchor).ready,true);assert.equal(m.dailyCalibration(records,anchor).averageAdherence,90);
 const sparse=records.map((x,i)=>i<10?x:({date:x.date,weight:x.weight,calories:x.calories}));assert.equal(m.dailyCalibration(sparse,anchor).ready,false);
});
test('calendar comparison uses two distinct observed windows',()=>{
 const records=Array.from({length:14},(_,i)=>({date:day(i),weight:i<7?82:80}));
 const result=m.checkinComparison(records,7,new Date(day(13)+'T12:00:00'));assert.equal(result.metrics.weight.delta,-2);assert.equal(result.metrics.weight.currentCount,7);assert.equal(result.metrics.weight.previousCount,7);
 const sparse=m.checkinComparison([records[0],records[13]],7,new Date(day(13)+'T12:00:00'));assert.equal(sparse.metrics.weight.delta,null);assert.equal(sparse.current.weight.delta,null);
});
test('calibration requires consecutive bounded daily observations',()=>{
 const records=Array.from({length:16},(_,i)=>({date:day(i),weight:80,calories:2600,adherence:90}));records.splice(8,1);assert.equal(m.dailyCalibration(records,anchor).ready,false);assert.equal(m.dailyCalibration(records,anchor).count,7);
});
