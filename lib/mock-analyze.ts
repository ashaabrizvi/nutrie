import type { AnalyzeResponse, Confidence } from "@/types";

/**
 * Placeholder for /api/analyze (built in Phase 3). Deterministic per input
 * so the same text always yields the same numbers during testing.
 */
export function mockAnalyze(rawInput: string): AnalyzeResponse {
  const trimmed = rawInput.trim();
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }

  const calories = 250 + (hash % 450);
  const protein = Math.round((calories * 0.18) / 4);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.round(Math.max(0, calories - protein * 4 - fat * 9) / 4);
  const fiber = Math.round(carbs * 0.1);

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const confidence: Confidence = wordCount >= 4 ? "medium" : wordCount >= 1 ? "low" : "low";

  const name = trimmed.slice(0, 40) || "Meal";

  return {
    text: `Placeholder estimate for "${name}" — real AI analysis arrives in Phase 3. Numbers below are a rough stand-in so you can test logging end to end.`,
    confidence,
    nutrition: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      confidence,
      items: [{ name, calories, protein, carbs, fat }],
    },
  };
}
