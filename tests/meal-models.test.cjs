const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../assets/js/meal-models.js');
const food={name:'Label food',referenceGrams:100,kcal:200,protein:10,fat:5,carbs:25};
test('recipe uses label energy, ingredient mass and equal portions',()=>{
  const result=model.calculate([{...food,grams:250}],2);
  assert.deepEqual(result.total,{grams:250,kcal:500,protein:25,fat:12.5,carbs:62.5});
  assert.equal(result.perPortion.kcal,250);
  assert.equal(result.perPortion.protein,12.5);
  assert.equal(result.labelDifference,37.5);
});
test('portion labels and small Russian decimal quantities remain exact until display',()=>{
  const result=model.calculate([{name:'Oil',referenceGrams:'15',kcal:'135',protein:'0',fat:'15',carbs:'0',grams:'0,5'}],1);
  assert.equal(result.total.kcal,4.5);assert.equal(result.total.fat,.5);
  assert.equal(model.number('106,5'),106.5);
});
test('missing, malformed, negative and physically impossible values are rejected',()=>{
  for(const value of ['',null,'NaN','Infinity','1,2,3','1e3',-1,Infinity])assert.throws(()=>model.calculate([{...food,grams:value}],1));
  for(const portions of [0,-1,1.5,1001,NaN,Infinity])assert.throws(()=>model.calculate([{...food,grams:100}],portions));
  assert.throws(()=>model.calculate([{...food,kcal:'',grams:100}],1));
  assert.throws(()=>model.calculate([{...food,fat:101,grams:100}],1));
  assert.throws(()=>model.calculate([{...food,referenceGrams:0,grams:100}],1));
});
test('recipe backup validates every entry before import',()=>{
  const valid={schema:1,products:[food],recipes:[{name:'Recipe',ingredients:[{...food,grams:250}],portions:2}]};
  assert.equal(model.validStore(valid),true);
  assert.equal(model.validStore({...valid,recipes:[...valid.recipes,{name:'Bad',ingredients:[],portions:1}]}),false);
  assert.equal(model.validStore({...valid,schema:2}),false);
});
