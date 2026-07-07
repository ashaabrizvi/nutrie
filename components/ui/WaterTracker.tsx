"use client";

interface WaterTrackerProps {
  glasses: number;
  target: number;
  onChange: (glasses: number) => void;
}

export default function WaterTracker({ glasses, target, onChange }: WaterTrackerProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="mb-3 text-sm font-semibold text-text">Water</p>
      <div className="flex justify-between gap-1.5">
        {Array.from({ length: target }).map((_, i) => {
          const filled = i < glasses;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(filled && i === glasses - 1 ? i : i + 1)}
              className="text-2xl transition-transform active:scale-90"
              aria-label={`${i + 1} glasses`}
            >
              {filled ? "💧" : "🥛"}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        {glasses} of {target} glasses
      </p>
    </div>
  );
}
