import type { Goal } from "@/types";

export interface BodyStats {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function calculateBMR({ weightKg, heightCm, age, gender }: BodyStats): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number): number {
  return bmr * 1.55;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_fat: 2.0,
  build_muscle: 1.8,
  recomposition: 1.8,
  maintenance: 1.4,
};

const FAT_PERCENT_OF_CALORIES = 0.25;

export function calculateTargets(stats: BodyStats, goal: Goal): Targets {
  const bmr = calculateBMR(stats);
  const tdee = calculateTDEE(bmr);

  const calories = Math.round(
    goal === "lose_fat" ? tdee - 300
      : goal === "build_muscle" ? tdee + 300
      : goal === "recomposition" ? tdee - 100
      : tdee,
  );

  const protein = Math.round(stats.weightKg * PROTEIN_G_PER_KG[goal]);
  const fat = Math.round((calories * FAT_PERCENT_OF_CALORIES) / 9);
  const carbs = Math.round(Math.max(0, calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs, fat };
}
