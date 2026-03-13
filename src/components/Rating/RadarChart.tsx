import type { RatingDetails } from '@/lib/types';

interface RadarChartProps {
  rating: RatingDetails;
  size?: number;
}

const labels = [
  { key: 'sillage', label: 'Sillage' },
  { key: 'longevity', label: 'Longevity' },
  { key: 'uniqueness', label: 'Einzigartig' },
  { key: 'value', label: 'Preis/Leistung' },
  { key: 'compliments', label: 'Komplimente' },
  { key: 'versatility', label: 'Vielseitig' },
] as const;

export function RadarChart({ rating, size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const levels = 5;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
    const r = (value / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
    const r = maxR + 20;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = ((level + 1) / levels) * maxR;
    const points = labels
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(' ');
    return points;
  });

  // Data polygon
  const dataPoints = labels
    .map((l, i) => {
      const val = rating[l.key as keyof RatingDetails] || 0;
      const p = getPoint(i, val);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="font-body">
      {/* Grid */}
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="#3a342c"
          strokeWidth={i === levels - 1 ? 1 : 0.5}
          opacity={0.6}
        />
      ))}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const p = getPoint(i, 10);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#3a342c"
            strokeWidth={0.5}
            opacity={0.4}
          />
        );
      })}

      {/* Data fill */}
      <polygon
        points={dataPoints}
        fill="#c9a96e"
        fillOpacity={0.15}
        stroke="#c9a96e"
        strokeWidth={2}
      />

      {/* Data points with values */}
      {labels.map((l, i) => {
        const val = rating[l.key as keyof RatingDetails] || 0;
        if (val === 0) return null;
        const p = getPoint(i, val);
        return (
          <g key={`point-${i}`}>
            <circle cx={p.x} cy={p.y} r={3} fill="#c9a96e" />
            <text
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              fill="#c9a96e"
              fontSize={9}
              fontWeight="bold"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => {
        const p = getLabelPoint(i);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#9a9088"
            fontSize={10}
          >
            {l.label}
          </text>
        );
      })}
    </svg>
  );
}
