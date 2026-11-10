/* Label-based recipe arithmetic. No food database and no inferred nutrients. */
(function (root) {
  'use strict';
  function number(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string' || !/^\s*\d+(?:[.,]\d+)?\s*$/.test(value)) return NaN;
    return Number(value.trim().replace(',', '.'));
  }
  function product(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('product');
    const name = String(raw.name || '').trim();
    if (!name || name.length > 120) throw new Error('name');
    const referenceGrams = number(raw.referenceGrams);
    if (!(referenceGrams > 0 && referenceGrams <= 10000)) throw new Error('reference');
    const result = {name, referenceGrams};
    for (const key of ['kcal', 'protein', 'fat', 'carbs']) {
      const value = number(raw[key]);
      if (!Number.isFinite(value) || value < 0 || value / referenceGrams > (key === 'kcal' ? 10 : 1)) throw new Error(key);
      result[key] = value;
    }
    if ((result.protein + result.fat + result.carbs) / referenceGrams > 1.05) throw new Error('macros');
    return result;
  }
  function calculate(ingredients, portions) {
    portions = number(portions);
    if (!Number.isInteger(portions) || portions < 1 || portions > 1000 || !Array.isArray(ingredients) || !ingredients.length || ingredients.length > 100) throw new Error('recipe');
    const total = {grams:0, kcal:0, protein:0, fat:0, carbs:0};
    const rows = ingredients.map(raw => {
      const item = product(raw), grams = number(raw.grams);
      if (!(grams > 0 && grams <= 100000)) throw new Error('grams');
      const row = {...item, grams};
      total.grams += grams;
      for (const key of ['kcal', 'protein', 'fat', 'carbs']) total[key] += item[key] * grams / item.referenceGrams;
      return row;
    });
    const perPortion = Object.fromEntries(Object.entries(total).map(([key,value]) => [key,value / portions]));
    const macroEnergy = total.protein * 4 + total.fat * 9 + total.carbs * 4;
    return {modelVersion:'label-recipe-1', ingredients:rows, portions, total, perPortion, macroEnergy, labelDifference:total.kcal - macroEnergy};
  }
  function validStore(value) {
    if (!value || value.schema !== 1 || !Array.isArray(value.products) || !Array.isArray(value.recipes) || value.products.length > 300 || value.recipes.length > 100) return false;
    try {
      value.products.forEach(product);
      value.recipes.forEach(recipe => { if (!recipe || typeof recipe.name !== 'string' || !recipe.name.trim() || recipe.name.length > 120) throw new Error('recipe name'); calculate(recipe.ingredients, recipe.portions); });
      return true;
    } catch (_) { return false; }
  }
  const api = {number, product, calculate, validStore};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarkovMadeMeals = api;
})(typeof window !== 'undefined' ? window : globalThis);
