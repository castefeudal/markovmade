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
    if (reps === 1) return {value:loadKg, confidence:'Ограниченная', method:'введённый одиночный повтор; максимальность не подтверждена'};
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
  // Calendar windows contain observed days only; no imputation or assumed adherence.
  function checkinComparison(entries, days, today=new Date()) {
    const current=checkinTrends(entries,days,today);
    const previousEnd=new Date(today);previousEnd.setDate(previousEnd.getDate()-days);
    const previous=checkinTrends(entries,days,previousEnd);
    const metrics={};
    for(const key of ['weight','waist','sleep','energy']) {
      const a=current[key],b=previous[key];
      metrics[key]={currentCount:a.count,previousCount:b.count,delta:a.average!==null&&b.average!==null&&a.count>=Math.ceil(days*.75)&&b.count>=Math.ceil(days*.75)?a.average-b.average:null};
    }
    return {current,previous,metrics};
  }
  function dailyCalibration(entries, today=new Date()) {
    const anchor=new Date(today);anchor.setHours(12,0,0,0);const floor=new Date(anchor);floor.setDate(floor.getDate()-179);
    const complete=(Array.isArray(entries)?entries:[]).filter(item=>item&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&new Date(item.date+'T12:00:00')<=anchor&&new Date(item.date+'T12:00:00')>=floor&&new Date(item.date).toISOString().slice(0,10)===item.date&&Number.isFinite(item.weight)&&item.weight>=35&&item.weight<=300&&Number.isFinite(item.calories)&&item.calories>=1000&&item.calories<=8000).sort((a,b)=>a.date.localeCompare(b.date));
    let run=[];
    for(const item of complete){const last=run.at(-1);if(last&&(Date.parse(item.date)-Date.parse(last.date))/86400000!==1)run=[];run.push(item);}
    const sample=run.slice(-28),count=sample.length;
    if(count<14)return {ready:false,count,reason:'days'};
    const known=sample.filter(item=>Number.isFinite(item.adherence)&&item.adherence>=0&&item.adherence<=100);
    if(known.length<Math.ceil(count*.75))return {ready:false,count,adherenceCount:known.length,reason:'adherence'};
    const averageCalories=average(sample.map(item=>item.calories));
    const averageAdherence=average(known.map(item=>item.adherence));
    const waist=sample.filter(item=>Number.isFinite(item.waist)&&item.waist>=40&&item.waist<=200);
    const waistDelta=waist.length>=2?waist.at(-1).waist-waist[0].waist:NaN;
    return {ready:true,count,sample,adherenceCount:known.length,averageCalories,averageAdherence,waistDelta,result:maintenanceCalibration(sample.map(item=>item.weight),averageCalories,100,averageAdherence,waistDelta)};
  }
  function personalRecoveryBaseline(entries, minimumDays=14) {
    const valid = Array.isArray(entries) ? entries.filter(entry => entry && Number.isFinite(entry.rhr) && entry.rhr >= 30 && entry.rhr <= 130 && Number.isFinite(entry.hrv) && entry.hrv >= 5 && entry.hrv <= 300) : [];
    const median = values => { const sorted=values.slice().sort((a,b)=>a-b), mid=Math.floor(sorted.length/2); return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2; };
    if (valid.length < minimumDays) return {ready:false,days:valid.length,required:minimumDays,rhr:null,hrv:null};
    const sample = valid.slice(-28);
    return {ready:true,days:valid.length,required:minimumDays,rhr:median(sample.map(entry=>entry.rhr)),hrv:median(sample.map(entry=>entry.hrv))};
  }

  // Sensitivity to an explicitly chosen BF error, not a confidence interval.
  function bodySensitivity({weight,height,bodyFat,delta=null,targetBodyFat=null}){
    if(!Number.isFinite(weight)||weight<35||weight>300||!Number.isFinite(height)||height<120||height>230||!Number.isFinite(bodyFat)||bodyFat<=0||bodyFat>=70)throw new Error('body inputs');
    const supplied=delta!==null&&delta!==''&&delta!==undefined;
    if(supplied&&(!Number.isFinite(delta)||delta<0||bodyFat-delta<=0||bodyFat+delta>=70))throw new Error('body uncertainty');
    const point=bf=>{const fatMass=weight*bf/100,leanMass=weight-fatMass;return {bodyFat:bf,fatMass,leanMass,ffmi:leanMass/(height/100)**2,targetWeight:Number.isFinite(targetBodyFat)&&targetBodyFat>0&&targetBodyFat<60?leanMass/(1-targetBodyFat/100):null};};
    return {modelVersion:'1.0.0',kind:'scenario arithmetic',supplied,center:point(bodyFat),low:supplied?point(bodyFat-delta):null,high:supplied?point(bodyFat+delta):null};
  }
  function parseManualWeights(value){
    const raw=String(value||'').trim();if(!raw)return [];
    let tokens;
    if(/[;\n]/.test(raw))tokens=raw.split(/[;\n]+/).map(token=>token.trim()).filter(Boolean);
    else if(/,\s/.test(raw)||raw.includes('.')&&raw.includes(','))tokens=raw.split(/[,\s]+/);
    else if(/\s/.test(raw))tokens=raw.split(/\s+/);
    else if(/^\d+,\d{1,3}$/.test(raw))tokens=[raw];
    else tokens=raw.split(',');
    if(tokens.length>180)throw new Error('weights');
    return tokens.map(token=>{if(!/^\d+(?:[.,]\d+)?$/.test(token))throw new Error('weights');const number=Number(token.replace(',','.'));if(!Number.isFinite(number)||number<35||number>300)throw new Error('weights');return number;});
  }
  function utcDay(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const date=Date.parse(value+'T00:00:00Z');return Number.isFinite(date)&&new Date(date).toISOString().slice(0,10)===value?date/86400000:null;
  }
  function medianOf(values){const sorted=values.slice().sort((a,b)=>a-b),half=Math.floor(sorted.length/2);return sorted.length?(sorted.length%2?sorted[half]:(sorted[half-1]+sorted[half])/2):null;}
  function datedTrend(entries,days=28,endDate){
    if(![7,14,28].includes(days))throw new Error('trend window');
    const unique=new Map();
    for(const row of Array.isArray(entries)?entries:[]){const day=utcDay(row?.date);if(day!==null&&Number.isFinite(row.weight)&&row.weight>=35&&row.weight<=300)unique.set(row.date,{...row,day});}
    const sorted=[...unique.values()].sort((a,b)=>a.day-b.day),end=endDate===undefined?sorted.at(-1)?.day:utcDay(endDate);
    if(endDate!==undefined&&end===null)throw new Error('trend date');
    const observations=sorted.filter(row=>row.day<=end&&row.day>end-days),count=observations.length,span=count?observations.at(-1).day-observations[0].day:0;
    const slopes=[];for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)slopes.push((observations[j].weight-observations[i].weight)/(observations[j].day-observations[i].day));
    const dailySlope=medianOf(slopes),center=count?medianOf(observations.map(row=>row.weight)):null;
    const intercept=dailySlope===null?null:medianOf(observations.map(row=>row.weight-dailySlope*(row.day-observations[0].day)));
    const residuals=observations.map(row=>row.weight-(intercept+dailySlope*(row.day-observations[0].day))),residualMedian=medianOf(residuals),mad=medianOf(residuals.map(value=>Math.abs(value-residualMedian)));
    const flags=dailySlope===null?[]:observations.filter((row,i)=>Math.abs(residuals[i]-residualMedian)>Math.max(.5,3*1.4826*mad)).map(row=>row.date);
    const waist=observations.filter(row=>Number.isFinite(row.waist)&&row.waist>=40&&row.waist<=200),adherence=observations.filter(row=>Number.isFinite(row.adherence)&&row.adherence>=0&&row.adherence<=100);
    return {modelVersion:'1.0.0',kind:'dated statistical trend',days,count,span,ready:count>=7&&span>=6,coverage:count/days,observations,dailySlope,weeklySlope:dailySlope===null?null:dailySlope*7,intercept,median:center,min:count?Math.min(...observations.map(row=>row.weight)):null,max:count?Math.max(...observations.map(row=>row.weight)):null,mad,flags,waistChange:waist.length>=2?waist.at(-1).waist-waist[0].waist:null,adherenceCount:adherence.length,adherenceMean:adherence.length?average(adherence.map(row=>row.adherence)):null};
  }
  function datedRecoveryBaseline(entries,{minimumDays=14,device='',endDate}={}){
    const unique=new Map(),selected=String(device).trim();
    for(const row of Array.isArray(entries)?entries:[]){if(utcDay(row?.date)===null||String(row.device||'').trim()!==selected||!Number.isFinite(row.rhr)||row.rhr<30||row.rhr>130||!Number.isFinite(row.hrv)||row.hrv<5||row.hrv>300)continue;unique.set(row.date,row);}
    const sorted=[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)),end=endDate===undefined?utcDay(sorted.at(-1)?.date):utcDay(endDate);
    if(endDate!==undefined&&end===null)throw new Error('baseline date');
    const sample=sorted.filter(row=>utcDay(row.date)<=end&&utcDay(row.date)>end-28),ready=Boolean(selected)&&sample.length>=minimumDays;
    return {modelVersion:'1.0.0',ready,days:sample.length,required:minimumDays,rhr:ready?medianOf(sample.map(row=>row.rhr)):null,hrv:ready?medianOf(sample.map(row=>row.hrv)):null,device:selected,deviceVerified:Boolean(selected),sample};
  }
  function compareTrainingSessions(sessions,{step,ceiling}={}){
    if(!Array.isArray(sessions)||sessions.length>12||!Number.isFinite(step)||step<=0||step>10||!Number.isInteger(ceiling)||ceiling<1||ceiling>30)throw new Error('session inputs');
    const clean=sessions.map(row=>{
      const item={...row};for(const key of ['exercise','technique','rom'])if(typeof item[key]!=='string'||!item[key].trim()||item[key].length>80)throw new Error('session protocol');else item[key]=item[key].trim();
      for(const [key,min,max,whole]of [['load',1,500,false],['reps',1,30,true],['sets',1,30,true],['rir',0,5,false],['rest',15,900,true]])if(!Number.isFinite(item[key])||item[key]<min||item[key]>max||(whole&&!Number.isInteger(item[key])))throw new Error('session range');return item;
    });
    const last=clean.at(-1),reasons=[],norm=value=>String(value).trim().toLowerCase();
    if(clean.length<2)reasons.push('observations');
    const recent=clean.slice(-2),comparable=recent.length===2&&['exercise','load','sets','technique','rom','rest'].every(key=>norm(recent[0][key])===norm(recent[1][key]));
    if(clean.length>=2&&!comparable)reasons.push('conditions');
    if(recent.some(row=>row.reps<ceiling))reasons.push('reps');
    if(recent.some(row=>row.rir<2))reasons.push('rir');
    if(last&&step/last.load>.1)reasons.push('increment');
    const increase=Boolean(last&&comparable&&!reasons.length),status=increase?'consider-increase':clean.length<2?'more-observations':!comparable?'review-conditions':'maintain';
    return {modelVersion:'1.0.0',kind:'MARKOVMADE heuristic',status,increase,comparable,reasons,sessions:clean,next:last?(increase?last.load+step:last.load):null};
  }

  return Object.freeze({
    bodySensitivity, datedTrend, datedRecoveryBaseline, compareTrainingSessions, parseManualWeights,
    mifflin, tenHaaf, tenHaafFFM, navyBodyFat, ffmi, tdeeFromPal, dailySurplus,
    energyEquivalentFatKg, weightedTef, glycogenRange, average, movingAverage,
    regressionSlope, maintenanceCalibration, plateauStatus, detectWeightOutliers, robustDailySlope, estimate1RM, checkinTrends, checkinComparison, dailyCalibration, personalRecoveryBaseline
  });
});
