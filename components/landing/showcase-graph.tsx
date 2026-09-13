export function TrendGraph({ height = 54 }: { height?: number }) {
  const points = "0,44 14,38 28,41 42,30 56,33 70,22 84,26 98,12 112,17 128,6";
  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 128 46"
      preserveAspectRatio="none"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lpTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7890FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7890FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="#526DDF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,46 ${points.replace(/,/g, ",")} 128,46`}
        fill="url(#lpTrendFill)"
      />
    </svg>
  );
}

export function AreaGraph({ height = 90 }: { height?: number }) {
  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 320 90"
      preserveAspectRatio="none"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lpAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7890FF" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#7890FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points="0,72 24,62 48,68 72,50 96,58 120,40 144,48 168,28 192,36 216,22 240,30 264,14 288,20 320,8"
        fill="none"
        stroke="#526DDF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points="0,72 24,62 48,68 72,50 96,58 120,40 144,48 168,28 192,36 216,22 240,30 264,14 288,20 320,8 320,90 0,90"
        fill="url(#lpAreaFill)"
      />
    </svg>
  );
}

export function Bars({ data, color = "#0A193D" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64 }}>
      {data.map((v, i) => {
        const h = Math.max(10, Math.round((v / max) * 56));
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              borderRadius: "6px 6px 2px 2px",
              background: color,
              opacity: 0.25 + (i / data.length) * 0.75,
            }}
          />
        );
      })}
    </div>
  );
}