"use client";

import { motion } from "framer-motion";

interface MacroBarsProps {
  carbs: { consumed: number; target: number };
  protein: { consumed: number; target: number };
  fat: { consumed: number; target: number };
}

export default function MacroBars({ carbs, protein, fat }: MacroBarsProps) {
  const rows = [
    { label: "Carbs", color: "var(--green)", ...carbs },
    { label: "Protein", color: "var(--yellow)", ...protein },
    { label: "Fat", color: "var(--accent2)", ...fat },
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => {
        const pct = row.target > 0 ? Math.min(row.consumed / row.target, 1) * 100 : 0;
        return (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-muted">{row.label}</span>
              <span className="font-mono text-text">
                {Math.round(row.consumed)}/{Math.round(row.target)}g
              </span>
            </div>
            <div className="h-2 w-full rounded-pill bg-muted2">
              <motion.div
                className="h-2 rounded-pill"
                style={{ backgroundColor: row.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
