/* Pure calculation primitives shared by MARKOVMADE LAB and deterministic unit fixtures. */
(function (root, factory) {
  const models = factory();
  if (typeof module === 'object' && module.exports) module.exports = models;
  if (root) root.MarkovMadeModels = models;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';

  const defaultTef = {
    protein: [0.20, 0.25, 0.30],
    carbs: [0.05, 0.075, 0.10],
    fat: [0.00, 0.02, 0.03],
    alcohol: [0.10, 0.20, 0.30]
  };
  const mifflin = (sex, age, heightCm, weightKg) => 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  const tenHaaf = (sex, age, heightCm, weightKg) => 29.279 + 11.936 * weightKg + 587.728 * (heightCm / 100) - 8.129 * age + 191.027 * (sex === 'male' ? 1 : 0);
  const tenHaafFFM = ffm => 22.771 * ffm + 484.264;
  function navyBodyFat(sex, heightCm, waistCm, neckCm, hipsCm) {
    const height = heightCm / 2.54, waist = waistCm / 2.54, neck = neckCm / 2.54;
    if (!(height > 0)) return NaN;
    if (sex === 'male') {
      if (!(waist > neck)) return NaN;
      return 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    }
    if (sex !== 'female') return NaN;
    const hips = hipsCm / 2.54;
    if (!(waist + hips > neck)) return NaN;
    return 163.205 * Math.log10(waist + hips - neck) - 97.684 * Math.log10(height) - 78.387;
  }
  const ffmi = (weightKg, bodyFatPct, heightCm) => {
    const heightM = heightCm / 100;
    return heightM > 0 ? weightKg * (1 - bodyFatPct / 100) / (heightM * heightM) : NaN;
  };
  const tdeeFromPal = (rmr, pal) => rmr * pal;
  const dailySurplus = (intakeKcal, maintenanceKcal) => intakeKcal - maintenanceKcal;
  const energyEquivalentFatKg = (surplusKcalPerDay, days, kcalPerKg = 7700) => Math.max(0, surplusKcalPerDay) * days / kcalPerKg;
  function weightedTef(proteinKcal, fatKcal, carbsKcal, alcoholKcal, tef = defaultTef) {
    const total = proteinKcal + fatKcal + carbsKcal + alcoholKcal;
    if (total <= 0) return { low: .05, mid: .10, high: .15 };
    const value = index => (proteinKcal * tef.protein[index] + fatKcal * tef.fat[index] + carbsKcal * tef.carbs[index] + alcoholKcal * tef.alcohol[index]) / total;
    return { low: value(0), mid: value(1), high: value(2) };
  }
  function glycogenRange(status, training, carbs) {
    let low = 0, high = 300;
    if (status === 'normal') { low = 0; high = 100; }
    if (status === 'deficit') { low = 75; high = 250; }
    if (status === 'lowcarb' || status === 'multiworkout') { low = 150; high = 400; }
    if (status === 'workout') { low = 75; high = 250; }
    if (training === 'strength') high += 50;
    if (training === 'endurance') { low += 50; high += 100; }
    high = Math.min(high, 500);
    low = Math.min(low, high);
    if (Number.isFinite(carbs)) { high = Math.min(high, Math.max(0, carbs)); low = Math.min(low, high); }
    return [low, high];
  }
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
  function movingAverage(values, windowSize = 7) {
    const result = [];
    for (let i = windowSize - 1; i < values.length; i++) result.push(average(values.slice(i - windowSize + 1, i + 1)));
    return result;
  }
  function regressionSlope(values) {
    const count = values.length;
    if (count < 2) return NaN;
    const meanX = (count - 1) / 2, meanY = average(values);
    let numerator = 0, denominator = 0;
    for (let index = 0; index < count; index++) {
      numerator += (index - meanX) * (values[index] - meanY);
      denominator += (index - meanX) * (index - meanX);
    }
    return denominator ? numerator / denominator : 0;
  }
  function plateauStatus(dailyWeights, weeks, weeklyPct, waistDelta) {
    if (dailyWeights.length >= 14) {
      const previous = average(dailyWeights.slice(-14, -7));
      const recent = average(dailyWeights.slice(-7));
      const changePct = (recent - previous) / previous * 100;
      return Math.abs(changePct) < .15 && (!Number.isFinite(waistDelta) || Math.abs(waistDelta) < .5) ? 'Возможен' : 'Не подтверждается';
    }
    if (weeks >= 3 && Math.abs(weeklyPct) < .15 && Number.isFinite(waistDelta) && Math.abs(waistDelta) < .5) return 'Возможен';
    return 'Недостаточно данных';
  }

  return Object.freeze({
    mifflin, tenHaaf, tenHaafFFM, navyBodyFat, ffmi, tdeeFromPal, dailySurplus,
    energyEquivalentFatKg, weightedTef, glycogenRange, average, movingAverage,
    regressionSlope, plateauStatus
  });
});
