interface WeightSparklineProps {
  points: { weight_kg: number; log_date: string }[];
}

const WIDTH = 358;
const HEIGHT = 40;

export default function WeightSparkline({ points }: WeightSparklineProps) {
  if (points.length < 2) {
    return <p className="text-xs text-muted">Log your weight a few times to see a trend.</p>;
  }

  const weights = points.map((p) => p.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * WIDTH;
    const y = HEIGHT - ((p.weight_kg - min) / range) * HEIGHT;
    return `${x},${y}`;
  });

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
