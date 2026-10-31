const test=require('node:test'),assert=require('node:assert/strict');
const m=require('../assets/js/lab-models.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('manual daily weights preserve decimal commas and reject invalid entries without silently dropping them',()=>{
 assert.deepEqual(m.parseManualWeights('80,5\n80,4\n80.3'),[80.5,80.4,80.3]);
 assert.deepEqual(m.parseManualWeights('80.5, 80.4, 80.3'),[80.5,80.4,80.3]);
 assert.deepEqual(m.parseManualWeights('80,5;80,4;80,3'),[80.5,80.4,80.3]);
 assert.deepEqual(m.parseManualWeights('80,79,78'),[80,79,78]);
 assert.deepEqual(m.parseManualWeights(''),[]);
 for(const value of ['80;invalid;79','80\n0\n79','80\n301\n79','80,,79'])assert.throws(()=>m.parseManualWeights(value));
});
test('BF sensitivity propagates explicit bounds without inventing an interval',()=>{
 const input={weight:80,height:180,bodyFat:20,delta:3,targetBodyFat:15},r=m.bodySensitivity(input);
 near(r.low.fatMass,13.6);near(r.high.fatMass,18.4);near(r.high.leanMass,61.6);near(r.low.ffmi,66.4/1.8**2);near(r.high.targetWeight,61.6/.85);
 assert.equal(m.bodySensitivity({...input,delta:null}).low,null);assert.throws(()=>m.bodySensitivity({...input,delta:25}));
});
test('dated robust trend respects real elapsed days and never fills gaps',()=>{
 const rows=Array.from({length:7},(_,i)=>({date:`2026-10-${String(1+i*3).padStart(2,'0')}`,weight:100-i*.3}));
 const r=m.datedTrend(rows,28);near(r.weeklySlope,-.7);assert.equal(r.count,7);assert.equal(r.span,18);assert.equal(r.observations.length,7);assert.equal(r.ready,true);
 assert.equal(m.datedTrend(rows.slice(0,3),28).ready,false);assert.equal(m.datedTrend([],7).weeklySlope,null);
});
test('dated windows deduplicate dates, reject impossible dates, flag rather than erase outliers',()=>{
 const rows=Array.from({length:14},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,weight:100-i*.1,adherence:i%2?80:undefined}));rows[5].weight+=5;
 const r=m.datedTrend([...rows,{date:'2026-02-31',weight:90},rows[0]],14);assert.equal(r.count,14);assert.ok(r.flags.includes('2026-10-06'));assert.equal(r.observations.find(x=>x.date==='2026-10-06').weight,104.5);assert.equal(r.adherenceCount,7);assert.equal(r.adherenceMean,80);assert.equal(m.datedTrend(rows,7).count,7);
});
test('recovery baseline requires distinct valid dates and matching declared device',()=>{
 const rows=Array.from({length:14},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,rhr:55+i%2,hrv:50+i%2,device:'A'}));
 const r=m.datedRecoveryBaseline(rows,{device:'A'});assert.equal(r.ready,true);near(r.rhr,55.5);assert.equal(r.deviceVerified,true);assert.equal(m.datedRecoveryBaseline(rows,{device:'A',endDate:'2026-12-01'}).ready,false,'stale measurements do not form a current baseline');
 assert.equal(m.datedRecoveryBaseline(Array(20).fill(rows[0]),{device:'A'}).ready,false);assert.equal(m.datedRecoveryBaseline(rows,{device:'B'}).days,0);assert.equal(m.datedRecoveryBaseline(rows.slice(0,13),{device:'A'}).ready,false);
});
const session={exercise:'bench',load:60,reps:10,sets:3,rir:2,technique:'controlled',rom:'full',rest:180};
test('progression explains protocol differences and requires two actual comparable sessions',()=>{
 const options={step:2.5,ceiling:10};assert.equal(m.compareTrainingSessions([session,session],options).next,62.5);
 assert.equal(m.compareTrainingSessions([session],options).status,'more-observations');
 for(const field of ['exercise','load','sets','technique','rom','rest']){const other={...session,[field]:typeof session[field]==='number'?session[field]+1:'changed'};const r=m.compareTrainingSessions([session,other],options);assert.equal(r.status,'review-conditions',field);assert.equal(r.increase,false);}
 assert.ok(m.compareTrainingSessions([session,{...session,rir:1}],options).reasons.includes('rir'));assert.ok(m.compareTrainingSessions([session,session],{...options,step:10}).reasons.includes('increment'));assert.throws(()=>m.compareTrainingSessions([{...session,rir:null},session],options));
});
