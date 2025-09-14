// resources/js/lib/bmi.ts
export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
export function calcBmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  const bmi = +(weightKg / (h*h)).toFixed(1);
  let category: BmiCategory = 'Underweight';
  if (bmi >= 30) category = 'Obese';
  else if (bmi >= 25) category = 'Overweight';
  else if (bmi >= 18.5) category = 'Normal';
  return { bmi, category };
}
