import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeInput } from "@/lib/cache";
import type { NutritionAnalysis, UserMemory } from "@/types";

export async function getUserMemory(
  supabase: SupabaseClient,
  userId: string,
  rawInput: string,
): Promise<UserMemory | null> {
  const normalized = normalizeInput(rawInput);

  const { data } = await supabase
    .from("user_memory")
    .select("*")
    .eq("user_id", userId)
    .eq("normalized_phrase", normalized)
    .maybeSingle<UserMemory>();

  return data ?? null;
}

export async function saveUserMemory(
  supabase: SupabaseClient,
  userId: string,
  rawInput: string,
  nutrition: NutritionAnalysis,
): Promise<void> {
  const normalized = normalizeInput(rawInput);

  const existing = await getUserMemory(supabase, userId, rawInput);

  if (existing) {
    await supabase
      .from("user_memory")
      .update({
        calories: nutrition.calories,
        protein_g: nutrition.protein,
        carbs_g: nutrition.carbs,
        fat_g: nutrition.fat,
        times_logged: existing.times_logged + 1,
        last_confirmed: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("user_memory").insert({
    user_id: userId,
    trigger_phrase: rawInput.trim(),
    normalized_phrase: normalized,
    calories: nutrition.calories,
    protein_g: nutrition.protein,
    carbs_g: nutrition.carbs,
    fat_g: nutrition.fat,
    times_logged: 1,
  });
}
