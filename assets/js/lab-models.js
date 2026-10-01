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
  function maintenanceCalibration(weights, averageCalories, completenessPct=100, adherencePct=90, waistDelta=NaN) {
    if (!Array.isArray(weights) || weights.some(value => !Number.isFinite(value) || value <= 0)) throw new Error('Daily weights must be positive finite values.');
    if (weights.length < 14 || weights.length > 28) throw new Error('Calibration requires 14–28 daily weights.');
    if (!Number.isFinite(averageCalories) || averageCalories < 1000 || averageCalories > 8000) throw new Error('Average calories must be between 1000 and 8000 kcal/day.');
    if (![completenessPct, adherencePct].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) throw new Error('Completeness and adherence must be percentages from 0 to 100.');
    const median = values => { const sorted=values.slice().sort((a,b)=>a-b), middle=Math.floor(sorted.length/2); return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2; };
    const slopes=[];
    for(let i=0;i<weights.length;i++) for(let j=i+1;j<weights.length;j++) slopes.push((weights[j]-weights[i])/(j-i));
    const slopeKgPerDay=median(slopes), intercept=median(weights.map((weight,index)=>weight-slopeKgPerDay*index));
    const residuals=weights.map((weight,index)=>weight-(intercept+slopeKgPerDay*index));
    const centerResidual=median(residuals), noiseKg=1.4826*median(residuals.map(value=>Math.abs(value-centerResidual)));
    const meanWeight=average(weights), changePctPerWeek=slopeKgPerDay*7/meanWeight*100;
    const stable=Math.abs(changePctPerWeek)<.10 && (!Number.isFinite(waistDelta)||Math.abs(waistDelta)<.5);
    const formulaEnergy=stable?[averageCalories,averageCalories]:[averageCalories-slopeKgPerDay*9000,averageCalories-slopeKgPerDay*7000];
    const uncertainty=Math.max(stable?150:100,noiseKg*7000/Math.sqrt(weights.length));
    const low=Math.max(1000,Math.min(...formulaEnergy)-uncertainty), high=Math.min(8000,Math.max(...formulaEnergy)+uncertainty);
    const quality=completenessPct>=90&&adherencePct>=85&&noiseKg<=.7?'Хорошая':completenessPct>=75&&adherencePct>=70&&noiseKg<=1.2?'Средняя':'Низкая';
    const confidence=weights.length>=21&&completenessPct>=90&&adherencePct>=90&&noiseKg<=.5?'Выше средней':weights.length>=14&&completenessPct>=75&&adherencePct>=70&&noiseKg<=1.2?'Умеренная':'Низкая';
    return {days:weights.length,averageCalories,slopeKgPerDay,changePctPerWeek,noiseKg,stable,low,high,value:(low+high)/2,quality,confidence,completenessPct,adherencePct,waistDelta:Number.isFinite(waistDelta)?waistDelta:null,energyAssumption:stable?'stable trend: average intake weighted as observed maintenance':'energy balance sensitivity: 7000–9000 kcal/kg, not a fixed conversion'};
  }
  function detectWeightOutliers(values) {
    if (!Array.isArray(values) || values.length < 3) return [];
    const found=[];
    for(let i=1;i<values.length-1;i++){
      const local=(values[i-1]+values[i+1])/2, threshold=Math.max(1.5,Math.abs(local)*.02);
      if(Math.abs(values[i]-local)>threshold && Math.abs(values[i-1]-values[i+1])<=threshold) found.push({index:i,value:values[i],localTrend:local,difference:values[i]-local});
    }
    return found;
  }
  function robustDailySlope(values, excludedIndices=[]) {
    if(!Array.isArray(values)||values.length<2)return NaN;
    const excluded=new Set(excludedIndices),slopes=[];
    for(let i=0;i<values.length;i++)if(!excluded.has(i))for(let j=i+1;j<values.length;j++)if(!excluded.has(j))slopes.push((values[j]-values[i])/(j-i));
    if(!slopes.length)return NaN;
    slopes.sort((a,b)=>a-b);const mid=Math.floor(slopes.length/2);return slopes.length%2?slopes[mid]:(slopes[mid-1]+slopes[mid])/2;
  }
  function plateauStatus(dailyWeights, weeks, weeklyPct, waistDelta, adherencePct=NaN) {
    if(dailyWeights.length<14||!Number.isFinite(waistDelta)||!Number.isFinite(adherencePct)||adherencePct<80)return 'Недостаточно данных';
    const previous=average(dailyWeights.slice(-14,-7)),recent=average(dailyWeights.slice(-7));
    const changePct=(recent-previous)/previous*100;
    return Math.abs(changePct)<.15&&Math.abs(waistDelta)<.5&&Math.abs(weeklyPct)<.15?'Возможен':'Не подтверждается';
  }
  function estimate1RM(loadKg, reps) {
    if (!Number.isFinite(loadKg) || loadKg <= 0 || !Number.isInteger(reps) || reps < 1 || reps > 15) throw new Error('Enter a positive load and 1–15 repetitions.');
    if (reps === 1) return {value:loadKg, confidence:'Высокая', method:'введённый одиночный максимум'};
    const epley = loadKg * (1 + reps / 30);
    const brzycki = reps < 12 ? loadKg * 36 / (37 - reps) : epley;
    const value = (epley + brzycki) / 2;
    return {value, confidence:reps <= 5 ? 'Умеренная' : reps <= 8 ? 'Ограниченная' : 'Низкая', method:reps < 12 ? 'среднее Epley и Brzycki' : 'Epley; при большем числе повторений неопределённость выше'};
  }
  function checkinTrends(entries, days, today=new Date()) {
    if (![7,14,28].includes(days)) throw new Error('Trend window must be 7, 14 or 28 days.');
    const anchor=new Date(today);anchor.setHours(12,0,0,0);
    const first=new Date(anchor);first.setDate(first.getDate()-days+1);
    const daily=new Map();
    for(const entry of Array.isArray(entries)?entries:[]){
      if(!entry||!/\d{4}-\d{2}-\d{2}/.test(entry.date))continue;
      const date=new Date(`${entry.date}T12:00:00`);
      if(Number.isNaN(date.getTime())||date<first||date>anchor)continue;
      daily.set(entry.date,entry);
    }
    const sample=[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date));
    const metric=(key,min,max)=>{
      const values=sample.filter(entry=>Number.isFinite(entry[key])&&entry[key]>=min&&entry[key]<=max);
      const span=values.length>1?(new Date(values.at(-1).date)-new Date(values[0].date))/86400000:0;
      const points=values.map(entry=>({date:entry.date,value:entry[key]}));
      if(values.length<3||span<Math.min(days-2,4))return {count:values.length,delta:null,average:null,points};
      const slopes=[];
      for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++){
        const distance=(new Date(values[j].date)-new Date(values[i].date))/86400000;
        if(distance>0)slopes.push((values[j][key]-values[i][key])/distance);
      }
      slopes.sort((a,b)=>a-b);
      const mid=Math.floor(slopes.length/2),slope=slopes.length%2?slopes[mid]:(slopes[mid-1]+slopes[mid])/2;
      return {count:values.length,delta:slope*span,average:average(values.map(entry=>entry[key])),points};
    };
    return {days,count:sample.length,weight:metric('weight',35,300),waist:metric('waist',40,200),energy:metric('energy',1,10),sleep:metric('sleep',0,16),entries:sample};
  }
  function personalRecoveryBaseline(entries, minimumDays=14) {
    const valid = Array.isArray(entries) ? entries.filter(entry => entry && Number.isFinite(entry.rhr) && entry.rhr >= 30 && entry.rhr <= 130 && Number.isFinite(entry.hrv) && entry.hrv >= 5 && entry.hrv <= 300) : [];
    const median = values => { const sorted=values.slice().sort((a,b)=>a-b), mid=Math.floor(sorted.length/2); return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2; };
    if (valid.length < minimumDays) return {ready:false,days:valid.length,required:minimumDays,rhr:null,hrv:null};
    const sample = valid.slice(-28);
    return {ready:true,days:valid.length,required:minimumDays,rhr:median(sample.map(entry=>entry.rhr)),hrv:median(sample.map(entry=>entry.hrv))};
  }

  return Object.freeze({
    mifflin, tenHaaf, tenHaafFFM, navyBodyFat, ffmi, tdeeFromPal, dailySurplus,
    energyEquivalentFatKg, weightedTef, glycogenRange, average, movingAverage,
    regressionSlope, maintenanceCalibration, plateauStatus, detectWeightOutliers, robustDailySlope, estimate1RM, checkinTrends, personalRecoveryBaseline
  });
});
