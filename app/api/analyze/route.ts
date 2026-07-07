import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { normalizeInput, hashInput } from "@/lib/cache";
import { analyzeFoodWithClaude } from "@/lib/claude";
import type { AnalyzeResponse, FoodItem, MealType } from "@/types";

interface AnalyzeRequestBody {
  input: string;
  mealType: MealType;
  userId: string;
  language: "en" | "hi";
}

interface CachedRow {
  id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  items: FoodItem[];
  hit_count: number;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server" },
      { status: 500 },
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as Partial<AnalyzeRequestBody>;
  const { input, language } = body;

  if (!input?.trim()) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const normalized = normalizeInput(input);
  const hash = hashInput(normalized);

  const { data: cached } = await supabase
    .from("food_cache")
    .select("id, calories, protein_g, carbs_g, fat_g, fiber_g, items, hit_count")
    .eq("input_hash", hash)
    .maybeSingle<CachedRow>();

  if (cached) {
    await supabase
      .from("food_cache")
      .update({ hit_count: cached.hit_count + 1 })
      .eq("id", cached.id);

    const response: AnalyzeResponse = {
      text: buildCachedMessage(cached),
      confidence: "high",
      nutrition: {
        calories: cached.calories,
        protein: cached.protein_g,
        carbs: cached.carbs_g,
        fat: cached.fat_g,
        fiber: cached.fiber_g,
        items: cached.items,
        confidence: "high",
      },
    };
    return NextResponse.json(response);
  }

  let analysis: AnalyzeResponse;
  try {
    analysis = await analyzeFoodWithClaude(input, language === "hi" ? "hi" : "en");
  } catch (err) {
    console.error("Claude analysis failed", err);
    return NextResponse.json(
      { error: "Nutrie couldn't analyse that — please try again." },
      { status: 502 },
    );
  }

  if (analysis.confidence === "high") {
    await supabase.from("food_cache").upsert(
      {
        input_hash: hash,
        normalized_input: normalized,
        calories: analysis.nutrition.calories,
        protein_g: analysis.nutrition.protein,
        carbs_g: analysis.nutrition.carbs,
        fat_g: analysis.nutrition.fat,
        fiber_g: analysis.nutrition.fiber,
        items: analysis.nutrition.items,
        hit_count: 1,
      },
      { onConflict: "input_hash" },
    );
  }

  return NextResponse.json(analysis);
}

function buildCachedMessage(cached: CachedRow): string {
  const names = (cached.items ?? []).map((item) => item.name).filter(Boolean);
  const desc = names.length > 0 ? names.join(", ") : "that meal";
  return `Logged ${desc} again — about ${cached.calories} kcal, matching what you've had before.`;
}
