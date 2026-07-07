import { formatDisplayTime } from "@/lib/date";
import type { FoodLog } from "@/types";

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export default function LogItem({ log }: { log: FoodLog }) {
  const time = formatDisplayTime(new Date(log.logged_at));

  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-surface2 text-lg">
          {MEAL_EMOJI[log.meal_type] ?? "🍽️"}
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-text">
            {log.food_name ?? log.raw_input}
          </p>
          <p className="font-mono text-xs text-muted">
            {time} · P:{Math.round(log.protein_g)}g C:{Math.round(log.carbs_g)}g F:
            {Math.round(log.fat_g)}g
          </p>
        </div>
      </div>
      <span className="font-mono text-sm text-accent">{log.calories}</span>
    </div>
  );
}
