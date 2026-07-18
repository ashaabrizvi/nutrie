import { NextResponse } from "next/server";
import { reanalyzeWithCorrection } from "@/lib/claude";
import type { NutritionAnalysis } from "@/types";

interface ReanalyzeRequestBody {
  rawInput: string;
  newCalories: number;
  originalNutrition: NutritionAnalysis;
  language: "en" | "hi";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ReanalyzeRequestBody>;
  const { rawInput, newCalories, originalNutrition, language } = body;

  if (!rawInput?.trim() || typeof newCalories !== "number" || !originalNutrition) {
    return NextResponse.json(
      { error: "rawInput, newCalories, and originalNutrition are required" },
      { status: 400 },
    );
  }

  const nutrition = await reanalyzeWithCorrection(
    rawInput,
    newCalories,
    originalNutrition,
    language === "hi" ? "hi" : "en",
  );

  return NextResponse.json(nutrition);
}
