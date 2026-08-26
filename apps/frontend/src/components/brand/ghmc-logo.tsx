/**
 * GHMC Logo - inline SVG recreation of the green oval GHMC logo
 * Renders without needing an uploaded image file.
 */
export function GhmcLogo({ className = 'h-11 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Green oval */}
      <ellipse cx="80" cy="48" rx="76" ry="40" fill="#159a4f" />
      {/* Pink flowers top-right */}
      <g>
        <circle cx="112" cy="20" r="9" fill="#e6338a" />
        <circle cx="126" cy="16" r="7" fill="#d81b7a" />
        <circle cx="120" cy="28" r="6" fill="#f04a9b" />
        {/* petal dots */}
        <circle cx="112" cy="20" r="3" fill="#fbcfe8" />
        <circle cx="126" cy="16" r="2.5" fill="#fbcfe8" />
      </g>
      {/* GHMC text */}
      <text x="80" y="56" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="30" fill="#ffffff" letterSpacing="1">GHMC</text>
      {/* subtitle */}
      <text x="80" y="72" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="600" fontSize="7" fill="#ffffff" letterSpacing="0.5">GREATER HYDERABAD MUNICIPAL CORPORATION</text>
    </svg>
  );
}

/**
 * GHMC Seal - simplified circular emblem for background watermark
 */
export function GhmcSeal({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="98" fill="none" stroke="#159a4f" strokeWidth="3" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#159a4f" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="55" fill="none" stroke="#f5a623" strokeWidth="2" />
      {/* radiating lines (sun motif) */}
      {Array.from({ length: 48 }).map((_, i) => {
        const angle = (i * 360) / 48;
        const rad = (angle * Math.PI) / 180;
        const x1 = 100 + 40 * Math.cos(rad);
        const y1 = 100 + 40 * Math.sin(rad);
        const x2 = 100 + 54 * Math.cos(rad);
        const y2 = 100 + 54 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f5a623" strokeWidth="1.5" />;
      })}
      <circle cx="100" cy="100" r="22" fill="none" stroke="#159a4f" strokeWidth="2" />
      {/* Charminar silhouette */}
      <path d="M90 130 h20 v-14 h-4 v-6 h-3 v-4 h-6 v4 h-3 v6 h-4 z" fill="#c0392b" />
      <text x="100" y="18" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="7" fill="#159a4f">GREATER HYDERABAD</text>
      <text x="100" y="190" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="7" fill="#159a4f">CLEANLINESS IS NEXT TO GODLINESS</text>
    </svg>
  );
}
