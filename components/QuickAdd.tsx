"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { getTodayIST } from "@/lib/date";
import type { FoodLog, MealType } from "@/types";

export interface QuickAddItem {
  food_name: string;
  raw_input: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: FoodLog["confidence"];
}

export default function QuickAdd({
  userId,
  items,
  onLogged,
}: {
  userId: string;
  items: QuickAddItem[];
  onLogged: (log: FoodLog) => void;
}) {
  const supabase = createClient();
  const [loadingName, setLoadingName] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function handleQuickAdd(item: QuickAddItem) {
    setLoadingName(item.food_name);

    const { data, error } = await supabase
      .from("food_logs")
      .insert({
        user_id: userId,
        raw_input: item.raw_input,
        input_type: "text",
        meal_type: item.meal_type,
        food_name: item.food_name,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        fiber_g: item.fiber_g,
        items: [{ name: item.food_name, calories: item.calories, protein: item.protein_g, carbs: item.carbs_g, fat: item.fat_g }],
        confidence: item.confidence,
        log_date: getTodayIST(),
      })
      .select()
      .single();

    setLoadingName(null);

    if (!error && data) {
      onLogged(data as FoodLog);
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text">Log again?</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item.food_name}
            type="button"
            disabled={loadingName === item.food_name}
            onClick={() => handleQuickAdd(item)}
            className="shrink-0 rounded-pill border border-border bg-surface2 px-3 py-2 text-sm text-text disabled:opacity-60"
          >
            {loadingName === item.food_name ? "Adding..." : `+ ${item.food_name}`}
          </button>
        ))}
      </div>
    </div>
  );
}
