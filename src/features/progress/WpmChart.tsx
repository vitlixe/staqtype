const W = 900;
const H = 170;
const PAD = { left: 30, right: 8, top: 10, bottom: 22 };

/** WPM per run as a line, oldest run on the left. */
export function WpmChart({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <p className="text-sm text-dim">
        The chart appears after two finished lessons.
      </p>
    );
  }
  const lo = Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10);
  const hi = Math.max(lo + 20, Math.ceil((Math.max(...values) + 5) / 10) * 10);
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / (values.length - 1);
  const y = (v: number) => PAD.top + ((hi - v) * (H - PAD.top - PAD.bottom)) / (hi - lo);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  const ticks = [lo, Math.round((lo + hi) / 2), hi];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Words per minute over the last ${values.length} runs, from ${Math.round(values[0])} to ${Math.round(values[last])}`}
      className="block h-auto w-full font-mono text-[11px]"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-line" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-dim">
            {t}
          </text>
        </g>
      ))}
      <polygon
        points={`${x(0)},${y(lo)} ${points} ${x(last)},${y(lo)}`}
        className="fill-accent/10"
      />
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="stroke-accent"
      />
      <circle cx={x(last)} cy={y(values[last])} r={3.5} className="fill-accent" />
      <text x={x(0)} y={H - 4} className="fill-dim">
        {values.length} runs ago
      </text>
      <text x={W - PAD.right} y={H - 4} textAnchor="end" className="fill-dim">
        last · {Math.round(values[last])}
      </text>
    </svg>
  );
}
