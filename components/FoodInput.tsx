"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { saveUserMemory } from "@/lib/memory";
import { getTodayIST, getISTHour } from "@/lib/date";
import NutrieMessage from "@/components/ui/NutrieMessage";
import type { AnalyzeResponse, ClarificationRound, FoodLog, MealType, NutritionAnalysis } from "@/types";

const MEAL_CHIPS: { meal: MealType; emoji: string; label: string }[] = [
  { meal: "breakfast", emoji: "🌅", label: "Breakfast" },
  { meal: "lunch", emoji: "☀️", label: "Lunch" },
  { meal: "dinner", emoji: "🌙", label: "Dinner" },
  { meal: "snack", emoji: "🍎", label: "Snack" },
];

function defaultMealForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 19 && hour < 23) return "dinner";
  return "snack";
}

type Status = "idle" | "loading" | "done";

export default function FoodInput({
  userId,
  language,
  onLogged,
}: {
  userId: string;
  language: "en" | "hi";
  onLogged: (log: FoodLog) => void;
}) {
  const supabase = createClient();
  const [mealType, setMealType] = useState<MealType>(() => defaultMealForHour(getISTHour()));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ClarificationRound[]>([]);
  const [saving, setSaving] = useState(false);
  const [clarifying, setClarifying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(message: string, duration = 3000) {
    setNotice(message);
    setTimeout(() => setNotice(null), duration);
  }

  async function callAnalyze(history: ClarificationRound[]) {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, mealType, userId, language, conversationHistory: history }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Analysis failed");
    }

    return (await res.json()) as AnalyzeResponse;
  }

  async function handleAnalyse() {
    if (!input.trim()) return;
    setStatus("loading");
    setResult(null);
    setConversationHistory([]);

    try {
      const analysis = await callAnalyze([]);
      setResult(analysis);
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      showNotice(err instanceof Error ? err.message : "Something went wrong — try again.");
    }
  }

  async function handleClarify(answer: string) {
    if (!result || result.type !== "clarification") return;
    const nextHistory = [...conversationHistory, { question: result.question, answer }];
    setClarifying(true);

    try {
      const analysis = await callAnalyze(nextHistory);
      setConversationHistory(nextHistory);
      setResult(analysis);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Something went wrong — try again.");
    } finally {
      setClarifying(false);
    }
  }

  async function handleAdd(nutrition: NutritionAnalysis, wasEdited: boolean) {
    setSaving(true);

    const { data, error } = await supabase
      .from("food_logs")
      .insert({
        user_id: userId,
        raw_input: input.trim(),
        input_type: "text",
        meal_type: mealType,
        food_name: nutrition.items[0]?.name ?? input.trim().slice(0, 40),
        calories: nutrition.calories,
        protein_g: nutrition.protein,
        carbs_g: nutrition.carbs,
        fat_g: nutrition.fat,
        fiber_g: nutrition.fiber,
        items: nutrition.items,
        ai_response: result?.type === "analysis" ? result.text : null,
        confidence: nutrition.confidence,
        is_edited: wasEdited,
        log_date: getTodayIST(),
      })
      .select()
      .single();

    if (!error && data) {
      onLogged(data as FoodLog);

      if (wasEdited) {
        await saveUserMemory(supabase, userId, input.trim(), nutrition);
        showNotice("I'll remember this for next time ✓");
      }

      setInput("");
      setResult(null);
      setConversationHistory([]);
      setStatus("idle");
    }

    setSaving(false);
  }

  function showComingSoon(feature: string) {
    showNotice(`${feature} logging arrives in Phase 5.`, 2000);
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {MEAL_CHIPS.map((chip) => (
          <button
            key={chip.meal}
            type="button"
            onClick={() => setMealType(chip.meal)}
            className={`flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm ${
              mealType === chip.meal
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted"
            }`}
          >
            <span>{chip.emoji}</span>
            {chip.label}
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tell Nutrie what you ate... e.g. 'Dal chawal with ghee and one chai'"
        className="w-full resize-none rounded-input border border-border bg-surface2 px-4 py-3 text-sm text-text outline-none focus:border-accent"
      />
      <div className="mt-1 flex justify-end">
        <span className="text-xs text-muted">{input.length} chars</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => showComingSoon("Voice")}
            className="flex h-11 w-11 items-center justify-center rounded-button border border-border text-lg"
          >
            🎤
          </button>
          <button
            type="button"
            onClick={() => showComingSoon("Photo")}
            className="flex h-11 w-11 items-center justify-center rounded-button border border-border text-lg"
          >
            📷
          </button>
        </div>
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={!input.trim() || status === "loading"}
          className="rounded-button bg-accent px-5 py-3 font-heading text-sm font-bold text-black disabled:opacity-60"
        >
          {status === "loading" ? "Nutrie is thinking..." : "Analyse →"}
        </button>
      </div>

      {notice && <p className="mt-2 text-xs text-muted">{notice}</p>}

      {status === "done" && result && (
        <div className="mt-4">
          <NutrieMessage
            result={result}
            onAdd={handleAdd}
            onClarify={handleClarify}
            saving={saving}
            clarifying={clarifying}
          />
        </div>
      )}
    </div>
  );
}
