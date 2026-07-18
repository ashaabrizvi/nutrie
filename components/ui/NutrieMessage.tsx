"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AnalyzeResponse, Confidence, NutritionAnalysis } from "@/types";

const CONFIDENCE_META: Record<Confidence, { color: string; label: string }> = {
  high: { color: "var(--green)", label: "Confident estimate" },
  medium: { color: "var(--yellow)", label: "Approximate estimate" },
  low: { color: "var(--accent2)", label: "Rough estimate — be more specific" },
};

export default function NutrieMessage({
  result,
  onAdd,
  onClarify,
  saving,
  clarifying,
}: {
  result: AnalyzeResponse;
  onAdd: (nutrition: NutritionAnalysis, wasEdited: boolean) => void;
  onClarify: (answer: string) => void;
  saving: boolean;
  clarifying: boolean;
}) {
  if (result.type === "clarification") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-card border-l-4 border border-border bg-surface p-4"
        style={{ borderLeftColor: "var(--accent3)" }}
      >
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-accent3">◈</span>
          <span className="text-xs font-semibold tracking-wide text-accent3">NUTRIE AI</span>
        </div>

        <p className="text-sm text-text">{result.question}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {result.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={clarifying}
              onClick={() => onClarify(option)}
              className="rounded-pill border border-accent3/40 bg-accent3/10 px-3 py-1.5 text-sm text-text disabled:opacity-60"
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <AnalysisCard result={result} onAdd={onAdd} saving={saving} />
  );
}

function AnalysisCard({
  result,
  onAdd,
  saving,
}: {
  result: Extract<AnalyzeResponse, { type: "analysis" }>;
  onAdd: (nutrition: NutritionAnalysis, wasEdited: boolean) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(result.nutrition);
  const confidence = CONFIDENCE_META[values.confidence];

  const wasEdited =
    values.calories !== result.nutrition.calories ||
    values.protein !== result.nutrition.protein ||
    values.carbs !== result.nutrition.carbs ||
    values.fat !== result.nutrition.fat;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-card border-l-4 border border-border bg-surface p-4"
      style={{ borderLeftColor: "var(--accent3)" }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-accent3">◈</span>
        <span className="text-xs font-semibold tracking-wide text-accent3">NUTRIE AI</span>
        {result.fromMemory && (
          <span className="ml-1 rounded-pill bg-accent3/10 px-2 py-0.5 text-[10px] text-accent3">
            Using your saved version 🧠
          </span>
        )}
      </div>

      <p className="text-sm text-text">{result.text}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Pill>🔥 {values.calories} kcal</Pill>
        <Pill>💪 {values.protein}g</Pill>
        <Pill>🌾 {values.carbs}g</Pill>
        <Pill>🫒 {values.fat}g</Pill>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-pill" style={{ backgroundColor: confidence.color }} />
        <span className="text-xs text-muted">{confidence.label}</span>
      </div>

      {editing && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
            <label key={key} className="flex items-center justify-between rounded-input border border-border bg-surface2 px-3 py-2">
              <span className="text-xs capitalize text-muted">{key}</span>
              <input
                type="number"
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
                className="w-16 bg-transparent text-right font-mono text-sm text-text outline-none"
              />
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => onAdd(values, wasEdited)}
          className="rounded-button bg-accent px-5 py-2.5 font-heading text-sm font-bold text-black disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add to log"}
        </button>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="text-sm text-muted underline"
        >
          {editing ? "Done editing" : "Edit numbers"}
        </button>
      </div>
    </motion.div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill border border-border bg-surface2 px-2.5 py-1 text-xs text-text">
      {children}
    </span>
  );
}
