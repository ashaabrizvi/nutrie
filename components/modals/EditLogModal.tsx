"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { saveUserMemory } from "@/lib/memory";
import type { FoodLog, NutritionAnalysis } from "@/types";

export default function EditLogModal({
  open,
  onClose,
  log,
  userId,
  language,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  log: FoodLog | null;
  userId: string;
  language: "en" | "hi";
  onSaved: (log: FoodLog) => void;
}) {
  const supabase = createClient();

  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedLogId, setLoadedLogId] = useState<string | null>(null);

  if (log && log.id !== loadedLogId) {
    setLoadedLogId(log.id);
    setFoodName(log.food_name ?? log.raw_input);
    setCalories(log.calories);
    setProtein(log.protein_g);
    setCarbs(log.carbs_g);
    setFat(log.fat_g);
  }

  async function handleReanalyze() {
    if (!log) return;
    const originalNutrition: NutritionAnalysis = {
      calories: log.calories,
      protein: log.protein_g,
      carbs: log.carbs_g,
      fat: log.fat_g,
      fiber: log.fiber_g,
      items: log.items,
      confidence: log.confidence,
    };
    setReanalyzing(true);
    try {
      const res = await fetch("/api/analyze/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: log.raw_input,
          newCalories: calories,
          originalNutrition,
          language,
        }),
      });
      const nutrition = (await res.json()) as NutritionAnalysis;
      setCalories(nutrition.calories);
      setProtein(nutrition.protein);
      setCarbs(nutrition.carbs);
      setFat(nutrition.fat);
    } finally {
      setReanalyzing(false);
    }
  }

  async function handleSave() {
    if (!log) return;
    setSaving(true);

    const wasEdited =
      calories !== log.calories ||
      protein !== log.protein_g ||
      carbs !== log.carbs_g ||
      fat !== log.fat_g ||
      foodName !== (log.food_name ?? log.raw_input);

    const { data, error } = await supabase
      .from("food_logs")
      .update({
        food_name: foodName,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        is_edited: wasEdited || log.is_edited,
      })
      .eq("id", log.id)
      .select()
      .single();

    setSaving(false);

    if (!error && data) {
      if (wasEdited) {
        await saveUserMemory(supabase, userId, log.raw_input, {
          calories,
          protein,
          carbs,
          fat,
          fiber: log.fiber_g,
          items: log.items,
          confidence: log.confidence,
        });
      }
      onSaved(data as FoodLog);
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && log && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-[24px] border-t border-border bg-surface p-6"
          >
            <p className="mb-4 font-heading text-lg font-bold text-text">Edit entry</p>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Food name"
                className="rounded-input border border-border bg-surface2 px-4 py-3 text-sm text-text outline-none focus:border-accent"
              />

              <label className="flex items-center justify-between rounded-input border border-border bg-surface2 px-4 py-3">
                <span className="text-sm text-muted">Calories</span>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-24 bg-transparent text-right font-mono text-lg text-accent outline-none"
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col items-center gap-1 rounded-input border border-border bg-surface2 px-2 py-2">
                  <span className="text-xs text-muted">Protein</span>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-mono text-sm text-text outline-none"
                  />
                </label>
                <label className="flex flex-col items-center gap-1 rounded-input border border-border bg-surface2 px-2 py-2">
                  <span className="text-xs text-muted">Carbs</span>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-mono text-sm text-text outline-none"
                  />
                </label>
                <label className="flex flex-col items-center gap-1 rounded-input border border-border bg-surface2 px-2 py-2">
                  <span className="text-xs text-muted">Fat</span>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-mono text-sm text-text outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="rounded-button border border-border bg-surface2 py-2.5 text-sm font-medium text-text disabled:opacity-60"
              >
                {reanalyzing ? "Recalculating..." : "Re-analyse"}
              </button>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-button border border-border py-3 text-sm font-medium text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-button bg-accent py-3 font-heading text-sm font-bold text-black disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
