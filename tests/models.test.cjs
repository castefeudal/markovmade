const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/js/lab-models.js');

const near = (actual, expected, tolerance = .01) => assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} within ±${tolerance} of ${expected}`);

test('Mifflin–St Jeor fixtures match male and female reference calculations', () => {
  assert.equal(model.mifflin('male', 30, 180, 80), 1780);
  assert.equal(model.mifflin('female', 30, 165, 60), 1320.25);
});

test('ten Haaf and FFM equations match fixed numeric fixtures', () => {
  near(model.tenHaaf('male', 30, 180, 80), 1989.2264, .0001);
  near(model.tenHaafFFM(68), 2032.692, .001);
});

test('Navy circumference estimates match male/female fixtures and reject invalid geometry', () => {
  near(model.navyBodyFat('male', 180, 85, 40), 14.5264772, .0001);
  near(model.navyBodyFat('female', 165, 75, 32, 100), 30.2368064, .0001);
  assert.ok(Number.isNaN(model.navyBodyFat('male', 180, 35, 40)));
  assert.ok(Number.isNaN(model.navyBodyFat('female', 165, 15, 32, 10)));
});

test('FFMI, PAL maintenance and calorie surplus conversions match numeric fixtures', () => {
  near(model.ffmi(80, 15, 180), 20.98765432, .0000001);
  assert.equal(model.tdeeFromPal(1780, 1.55), 2759);
  assert.equal(model.dailySurplus(3000, 3000), 0);
  assert.equal(model.energyEquivalentFatKg(model.dailySurplus(3000, 3000), 3), 0);
  near(model.energyEquivalentFatKg(model.dailySurplus(3500, 3000), 7), 3500 / 7700, .000001);
});

test('macro weighted TEF and glycogen scenarios stay bounded by supplied carbohydrate intake', () => {
  const tef = model.weightedTef(400, 900, 800, 0);
  near(tef.low, .0571428571, .0000001);
  near(tef.mid, .0847619048, .0000001);
  near(tef.high, .1080952381, .0000001);
  assert.deepEqual(model.weightedTef(0, 0, 0, 0), {low:.05,mid:.1,high:.15});
  assert.deepEqual(model.glycogenRange('lowcarb', 'strength', 250), [150,250]);
  assert.deepEqual(model.glycogenRange('normal', 'none', 0), [0,0]);
});

test('weight trend smoothing and regression return expected daily slope', () => {
  assert.deepEqual(model.movingAverage([1,2,3,4,5,6,7], 7), [4]);
  near(model.regressionSlope([80,79.8,79.6,79.4]), -.2, .000001);
  assert.equal(model.regressionSlope([5,5,5,5]), 0);
  assert.ok(Number.isNaN(model.regressionSlope([5])));
});

test('plateau logic requires sufficient trend data and separates stable from moving trends', () => {
  assert.equal(model.plateauStatus(Array(7).fill(90), 1, 0, 0, 90), 'Недостаточно данных');
  assert.equal(model.plateauStatus(Array(14).fill(90), 2, 0, 0, 90), 'Возможен');
  const moving = [...Array(7).fill(90), ...Array(7).fill(91)];
  assert.equal(model.plateauStatus(moving, 2, 1.1, 0, 90), 'Не подтверждается');
  assert.equal(model.plateauStatus(Array(14).fill(90), 2, 0, 0, 60), 'Недостаточно данных');
  assert.equal(model.plateauStatus([], 3, 0, 0, 90), 'Недостаточно данных');
});

test('conservative weight outliers are surfaced without mutating raw data and robust trend resists spikes', () => {
  const raw=[80,79.9,79.8,82,79.6,79.5,79.4];
  assert.deepEqual(model.detectWeightOutliers(raw).map(item=>item.index),[3]);
  assert.equal(raw[3],82);
  near(model.robustDailySlope(raw),-.1,.001);
  near(model.robustDailySlope(raw,[3]),-.1,.001);
});


test('maintenance calibration requires 14–28 days and reports assumptions and data quality', () => {
  assert.throws(() => model.maintenanceCalibration(Array(13).fill(80),2800), /14–28/);
  const stable=model.maintenanceCalibration(Array(14).fill(80),2800,100,90,0);
  assert.equal(stable.stable,true);
  near(stable.value,2800,.01);
  assert.equal(stable.quality,'Хорошая');
  assert.equal(stable.confidence,'Умеренная');
  const losing=Array.from({length:21},(_,index)=>80-index*.05);
  const observed=model.maintenanceCalibration(losing,2800,98,94);
  assert.ok(observed.value>2800,'weight loss makes observed maintenance higher than intake');
  assert.match(observed.energyAssumption,/7000–9000/);
  const sparse=model.maintenanceCalibration(Array(14).fill(80),2800,60,55);
  assert.equal(sparse.confidence,'Низкая');
  assert.equal(sparse.quality,'Низкая');
});

test('e1RM fixtures are bounded by rep count and reduce confidence as reps rise', () => {
  assert.equal(model.estimate1RM(100,1).value,100);
  near(model.estimate1RM(100,5).value,114.58,.02);
  assert.equal(model.estimate1RM(100,5).confidence,'Умеренная');
  assert.equal(model.estimate1RM(100,10).confidence,'Низкая');
  assert.throws(()=>model.estimate1RM(100,16),/1–15/);
  assert.throws(()=>model.estimate1RM(0,5),/positive load/);
});

test('personal recovery baseline waits for 14 valid paired measurements and uses medians', () => {
  const entries=Array.from({length:13},(_,i)=>({rhr:55+i%2,hrv:50+i%2}));
  assert.deepEqual(model.personalRecoveryBaseline(entries),{ready:false,days:13,required:14,rhr:null,hrv:null});
  const ready=model.personalRecoveryBaseline([...entries,{rhr:70,hrv:20}]);
  assert.equal(ready.ready,true);
  assert.equal(ready.days,14);
  assert.equal(ready.rhr,55.5);
  assert.equal(ready.hrv,50);
  assert.equal(model.personalRecoveryBaseline([...entries,{rhr:NaN,hrv:60}]).days,13);
});

test('daily check-in trends require multiple spaced readings and preserve window boundaries', () => {
  const entries=Array.from({length:14},(_,index)=>({date:`2026-09-${String(index+17).padStart(2,'0')}`,weight:100-index*.1,waist:90-index*.05,energy:6+index%3,sleep:7}));
  const first=model.checkinTrends(entries,7,new Date('2026-09-30T12:00:00'));
  assert.equal(first.count,7);
  near(first.weight.delta,-.5,.001);
  assert.equal(first.energy.average>6,true);
  const wider=model.checkinTrends(entries,14,new Date('2026-09-30T12:00:00'));
  assert.equal(wider.count,14);
  assert.ok(wider.weight.delta<first.weight.delta);
  const sparse=model.checkinTrends(entries.slice(-2),7,new Date('2026-09-30T12:00:00'));
  assert.equal(sparse.weight.delta,null);
  assert.throws(()=>model.checkinTrends(entries,10),/7, 14 or 28/);
});
