"use client";

import { motion } from "framer-motion";

interface CalorieRingProps {
  consumed: number;
  target: number;
  carbs: { consumed: number; target: number };
  protein: { consumed: number; target: number };
  fat: { consumed: number; target: number };
}

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CalorieRing({ consumed, target, carbs, protein, fat }: CalorieRingProps) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = consumed > target;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--muted2)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isOver ? "var(--red)" : "var(--accent)"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - pct) }}
            transition={{ type: "spring", duration: 1 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl text-text">{consumed}</span>
          <span className="text-xs text-muted">of {target} kcal</span>
        </div>
      </div>

      <div className="flex w-full justify-center gap-2">
        <MacroPill label="Carbs" color="var(--green)" consumed={carbs.consumed} target={carbs.target} />
        <MacroPill label="Protein" color="var(--yellow)" consumed={protein.consumed} target={protein.target} />
        <MacroPill label="Fat" color="var(--accent2)" consumed={fat.consumed} target={fat.target} />
      </div>
    </div>
  );
}

function MacroPill({
  label,
  color,
  consumed,
  target,
}: {
  label: string;
  color: string;
  consumed: number;
  target: number;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5">
      <span className="h-1.5 w-1.5 rounded-pill" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted">{label}</span>
      <span className="font-mono text-xs text-text">
        {Math.round(consumed)}/{Math.round(target)}g
      </span>
    </div>
  );
}
