# Precision LAB calculation changes

## Evidence and limits

- [Mifflin et al. 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/): predictive resting energy expenditure equation derived from 498 healthy adults, ages 19–78. The equation remains unchanged. RMR and PAL estimates are not individual measurements.
- [Morton et al. 2018](https://bjsm.bmj.com/content/early/2018/01/18/bjsports-2017-097608): resistance-training supplementation meta-analysis in healthy adults. The estimated breakpoint near 1.6 g/kg/day and its uncertainty do not make 2.2 g/kg mandatory for every user, and do not establish a universal requirement for energy-restricted lean athletes.
- [NIDDK Body Weight Planner](https://www.niddk.nih.gov/bwp): energy expenditure and intake targets depend on activity and changing body weight. A static energy-equivalent calculation cannot establish individual tissue gain or a reliable date for reaching a weight goal.

## Model boundaries

Nutrition 3.0 propagates the existing expenditure scenario into goal sensitivity rather than inventing a narrow ±3% target band. The selected starting value is rounded to 50 kcal. The QUICK ±10% predictive sensitivity, editable PRO expenditure/logging sensitivity, user-selected intake error and 7000–9000 kcal/kg energy-equivalent bounds are explicit scenarios, not validated confidence intervals. They should not be read as precision guarantees. The observed calibration requires 14–28 consecutive daily weights; dated gaps cause an actionable error, never fabricated values.

The displayed protein/fat/carbohydrate plan conserves energy at 4/9/4 kcal per gram. These are macronutrient energy conventions, not an assertion that food labels must exactly equal their rounded macro arithmetic. The independent protein guidance range remains in stored results; the upper endpoint is optional. Historical records and equations are not recalculated or rewritten.

Progress 3.0 preserves entered observations and validates calendar dates. Comma decimals such as `106,5` are one measurement. Commas are not a list delimiter; use newlines, spaces or semicolons. Gap-aware slopes use actual day distances. Plateau and linear ETA remain limited scenarios and are withheld when observation requirements are not met.

Overfeeding 3.0 retains energy-equivalent sensitivity but does not divide a measured weight increase into invented fat/water/glycogen fractions. Original input data and historic model results remain available.

## Deterministic verification

`node --test tests/models.test.cjs tests/progress-models.test.cjs tests/grand-models.test.cjs tests/precision-models.test.cjs` — 33 passing fixtures. Includes old primitive results, dated gaps, impossible/duplicate dates, decimal commas, invalid finite values, calorie-sensitivity propagation and macro energy conservation.

## Body composition, recovery and training

- [Kouri et al. 1995](https://pubmed.ncbi.nlm.nih.gov/7496846/) studied 157 male athletes (83 anabolic-androgenic steroid users and 74 nonusers). Height-normalized FFMI is therefore not shown for women in the current model. This small observational sample cannot establish a universal natural-muscularity limit or determine an individual's drug use. The base FFMI remains an arithmetic lean-mass index inheriting the error of the chosen body-fat estimate.
- [ACSM position stand 2026](https://pubmed.ncbi.nlm.nih.gov/41843416/) synthesizes 137 systematic reviews involving more than 30,000 healthy adults, with resistance-training interventions lasting 6–52 weeks. It supports progressive resistance training and outcome-dependent prescription; it does not validate the product's exact progression increment, e1RM equations, universal set target or individual recovery score. The existing progression rule remains explicitly a planning heuristic and requires comparable sessions.
- [Australian Institute of Sport HRV best-practice guidance](https://www.ausport.gov.au/ais/position_statements/heart-rate-variability) concerns performance-support practitioners, coaches and athletes in high-performance sport. It supports standardized measurement and individual trends; it does not validate the app's specific 10% RHR or 20% HRV review thresholds as diagnostic limits. These remain explicit product heuristics requiring three consecutive observations after at least 14 earlier valid, distinct days.

Body model 2.0 rejects out-of-range circumference estimates instead of silently clamping them. Target weight is one conditional value at constant FFM, with no invented ±3% band. Recovery model 4.0 preserves historical legacy-score data but does not display a readiness index; it validates optional physiological inputs and deduplicates dates before forming personal baselines. A repeated physiological signal prompts review of measurement conditions and load, never a diagnosis.

The existing exercise log already records exercise/equipment/range, planned and actual sets, RIR, rest and dates. Existing 1RM and progression fixtures remain unchanged, preserving old saved model reproducibility. No new universal set-dose or fatigue score has been introduced.

Actual diary intake accepts 0–8000 kcal per recorded day, preserving observations separately from target guardrails. A calorie mean below the supported 1000 kcal calibration range returns a non-ready result with an explanation; it does not delete entries or manufacture a maintenance target.

## Meal-label arithmetic

The `label-recipe-1` meal model multiplies each entered label nutrient by ingredient grams / label-reference grams, sums the recipe and divides by the integer serving count. Label energy is retained; the 4/9/4 macro convention is only a separately displayed comparison because rounding, fibre and sugar alcohols can explain discrepancies. No food database or unspecified nutrient values are invented. The separate `tests/meal-models.test.cjs` fixtures include 250 g × 200 kcal/100 g ÷ 2 servings = 250 kcal/serving, and 0.5 g of an entered 900 kcal/100 g oil = 4.5 kcal.
