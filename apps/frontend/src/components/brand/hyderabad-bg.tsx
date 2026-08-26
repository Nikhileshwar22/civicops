/**
 * Hyderabad cityscape background.
 * Uses the real photo at /hyderabad-city.jpg (cover, landscape) when present,
 * with an SVG skyline silhouette as a graceful fallback behind it.
 */
export function HyderabadBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient base (fallback layer) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900" />

      {/* SVG skyline fallback (shows if photo missing) */}
      <svg
        viewBox="0 0 1440 500"
        className="absolute bottom-0 left-0 w-full h-full"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="monument" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        <g opacity="0.5" fill="url(#bldg)">
          <rect x="20" y="300" width="60" height="200" />
          <rect x="90" y="260" width="45" height="240" />
          <rect x="145" y="320" width="70" height="180" />
          <rect x="1180" y="280" width="55" height="220" />
          <rect x="1245" y="240" width="48" height="260" />
          <rect x="1300" y="300" width="65" height="200" />
        </g>
        <g fill="url(#monument)" opacity="0.85">
          <rect x="620" y="330" width="200" height="170" />
          <rect x="612" y="250" width="22" height="90" rx="4" />
          <rect x="806" y="250" width="22" height="90" rx="4" />
          <ellipse cx="720" cy="300" rx="40" ry="26" />
        </g>
        <rect x="0" y="490" width="1440" height="10" fill="#0f172a" />
      </svg>

      {/* Real photo layer - covers the fallback when the file exists */}
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: 'url(/hyderabad-city.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      />

      {/* Dark overlay for text contrast on the right side */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-slate-900/30 to-slate-900/60" />
    </div>
  );
}
