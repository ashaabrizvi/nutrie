"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDisplayDate, shiftDateString } from "@/lib/date";
import LogItem from "@/components/ui/LogItem";
import EditLogModal from "@/components/modals/EditLogModal";
import type { FoodLog, MealType } from "@/types";

const MEAL_SECTIONS: { meal: MealType; emoji: string; label: string }[] = [
  { meal: "breakfast", emoji: "🌅", label: "BREAKFAST" },
  { meal: "lunch", emoji: "☀️", label: "LUNCH" },
  { meal: "dinner", emoji: "🌙", label: "DINNER" },
  { meal: "snack", emoji: "🍎", label: "SNACKS" },
];

export default function LogScreen({
  userId,
  language,
  initialDate,
  initialLogs,
}: {
  userId: string;
  language: "en" | "hi";
  initialDate: string;
  initialLogs: FoodLog[];
}) {
  const supabase = createClient();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  async function loadDate(date: string) {
    setSelectedDate(date);
    setLoading(true);

    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", date)
      .eq("is_deleted", false)
      .order("logged_at", { ascending: true });

    setLogs((data ?? []) as FoodLog[]);
    setLoading(false);
  }

  async function handleDelete(log: FoodLog) {
    if (!window.confirm("Remove this entry?")) return;

    setLogs((prev) => prev.filter((l) => l.id !== log.id));
    await supabase.from("food_logs").update({ is_deleted: true }).eq("id", log.id);
  }

  function handleEdit(log: FoodLog) {
    setEditingLog(log);
    setEditModalOpen(true);
  }

  function handleSaved(updated: FoodLog) {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  const total = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein_g,
      carbs: acc.carbs + l.carbs_g,
      fat: acc.fat + l.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const dateObj = new Date(`${selectedDate}T00:00:00Z`);

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-extrabold text-text">Today&apos;s Log</h1>
          <span className="rounded-pill border border-border bg-surface px-3 py-1 font-mono text-sm text-accent">
            {total.calories} kcal
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => loadDate(shiftDateString(selectedDate, -1))}
            className="px-2 text-muted"
            aria-label="Previous day"
          >
            ◀
          </button>

          <label className="relative text-sm text-muted">
            {formatDisplayDate(dateObj)}
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => e.target.value && loadDate(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>

          <button
            type="button"
            onClick={() => loadDate(shiftDateString(selectedDate, 1))}
            className="px-2 text-muted"
            aria-label="Next day"
          >
            ▶
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-center text-sm text-muted">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-sm text-muted">Nothing logged on this day.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {MEAL_SECTIONS.map((section) => {
            const entries = logs.filter((l) => l.meal_type === section.meal);
            if (entries.length === 0) return null;
            const sectionTotal = entries.reduce((sum, l) => sum + l.calories, 0);

            return (
              <div key={section.meal}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
                  {section.emoji} {section.label} — {sectionTotal} kcal
                </p>
                <div className="flex flex-col gap-2">
                  {entries.map((log) => (
                    <LogItem
                      key={log.id}
                      log={log}
                      onEdit={() => handleEdit(log)}
                      onDelete={() => handleDelete(log)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between rounded-card border border-border bg-surface p-4 font-mono text-sm">
        <span className="text-muted">Total</span>
        <span className="text-text">
          {total.calories} kcal · P:{Math.round(total.protein)}g C:{Math.round(total.carbs)}g F:
          {Math.round(total.fat)}g
        </span>
      </div>

      <EditLogModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        log={editingLog}
        userId={userId}
        language={language}
        onSaved={handleSaved}
      />
    </div>
  );
}
