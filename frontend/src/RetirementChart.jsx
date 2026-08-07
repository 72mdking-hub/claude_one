const WIDTH = 640;
const HEIGHT = 320;
const PADDING = 48;

function buildPath(points, maxValue, minAge, maxAge) {
  const xFor = (age) => PADDING + ((age - minAge) / (maxAge - minAge)) * (WIDTH - PADDING * 2);
  const yFor = (value) => HEIGHT - PADDING - (value / maxValue) * (HEIGHT - PADDING * 2);
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.age).toFixed(1)} ${yFor(p.value).toFixed(1)}`).join(' ');
}

export default function RetirementChart({ years }) {
  if (!years || years.length === 0) return null;

  const minAge = years[0].age;
  const maxAge = years[years.length - 1].age;
  const maxValue = Math.max(...years.map((y) => y.nominalBalance));

  const nominalPath = buildPath(
    years.map((y) => ({ age: y.age, value: y.nominalBalance })),
    maxValue,
    minAge,
    maxAge
  );
  const realPath = buildPath(
    years.map((y) => ({ age: y.age, value: y.realBalance })),
    maxValue,
    minAge,
    maxAge
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  return (
    <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Projected retirement balance over time">
      {yTicks.map((tick) => {
        const y = HEIGHT - PADDING - (tick / maxValue) * (HEIGHT - PADDING * 2);
        return (
          <g key={tick}>
            <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PADDING - 8} y={y + 4} fontSize="11" textAnchor="end" fill="#64748b">
              ${(tick / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}
      <text x={PADDING} y={HEIGHT - 12} fontSize="11" fill="#64748b">{minAge}</text>
      <text x={WIDTH - PADDING} y={HEIGHT - 12} fontSize="11" textAnchor="end" fill="#64748b">{maxAge}</text>

      <path d={nominalPath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <path d={realPath} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 4" />

      <g transform={`translate(${WIDTH - 210}, ${PADDING - 24})`}>
        <line x1="0" y1="0" x2="20" y2="0" stroke="#2563eb" strokeWidth="2.5" />
        <text x="26" y="4" fontSize="12" fill="#334155">Nominal</text>
        <line x1="90" y1="0" x2="110" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 4" />
        <text x="116" y="4" fontSize="12" fill="#334155">Real ($ today)</text>
      </g>
    </svg>
  );
}
