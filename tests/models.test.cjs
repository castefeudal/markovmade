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
  assert.equal(model.plateauStatus(Array(7).fill(90), 1, 0, 0), 'Недостаточно данных');
  assert.equal(model.plateauStatus(Array(14).fill(90), 2, 0, 0), 'Возможен');
  const moving = [...Array(7).fill(90), ...Array(7).fill(91)];
  assert.equal(model.plateauStatus(moving, 2, 1.1, 0), 'Не подтверждается');
  assert.equal(model.plateauStatus([], 3, 0, 0), 'Возможен');
});
