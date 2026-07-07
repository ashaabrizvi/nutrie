export default function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1 rounded-pill border border-border bg-surface px-2.5 py-1">
      <span className="text-sm">🔥</span>
      <span className="font-mono text-xs text-text">{streak}</span>
    </div>
  );
}
