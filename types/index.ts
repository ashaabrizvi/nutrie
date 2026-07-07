export type Language = "en" | "hi";
export type Goal = "lose_fat" | "build_muscle" | "recomposition" | "maintenance";
export type Plan = "free" | "pro" | "coach";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Confidence = "high" | "medium" | "low";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string | null;
  language: Language;
  age: number | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: Goal;
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  water_target: number;
  streak: number;
  longest_streak: number;
  last_logged: string | null;
  plan: Plan;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLog {
  id: string;
  user_id: string;
  raw_input: string;
  input_type: "text" | "voice" | "photo";
  meal_type: MealType;
  food_name: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  items: FoodItem[];
  ai_response: string | null;
  confidence: Confidence;
  photo_url: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  log_date: string;
  logged_at: string;
}

export interface BodyLog {
  id: string;
  user_id: string;
  weight_kg: number;
  notes: string | null;
  log_date: string;
  logged_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  glasses: number;
  log_date: string;
  logged_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  meal_type: MealType;
  reminder_time: string;
  enabled: boolean;
  days: string[];
}

export interface WeeklyBriefPattern {
  text: string;
  color: "green" | "yellow" | "red" | "blue";
}

export interface WeeklyBrief {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
  deficit_days: number;
  surplus_days: number;
  missed_days: number;
  score: number;
  score_reason: string;
  patterns: WeeklyBriefPattern[];
  one_change: string;
  one_change_impact: string;
  motivational_close: string;
  daily_data: unknown[];
  generated_at: string;
}

export interface NutritionAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  items: FoodItem[];
  confidence: Confidence;
}

export interface AnalyzeResponse {
  text: string;
  nutrition: NutritionAnalysis;
  confidence: Confidence;
}
