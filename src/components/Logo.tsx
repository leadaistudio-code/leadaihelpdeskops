import type { CSSProperties } from "react";

/*
  LeadAIStudio brand mark — "Node Lattice": an isometric cube drawn as a
  connected network of endpoints with the front node pinging. Pure SVG, scales
  cleanly. Colors are brand-fixed (signal-mint).
*/
export function LogoMark({
  size = 34,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="img"
      aria-label="LeadAIStudio"
    >
      <g stroke="#12B489" strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M50 20 L82 38 L50 56 L18 38 Z" />
        <path d="M82 38 L82 72 L50 90 L50 56" />
        <path d="M18 38 L18 72 L50 90" />
      </g>
      <line x1="50" y1="56" x2="50" y2="90" stroke="#38E8B0" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
      <g fill="#38E8B0">
        <circle cx="50" cy="20" r="4.5" />
        <circle cx="82" cy="38" r="4.5" />
        <circle cx="18" cy="38" r="4.5" />
        <circle cx="82" cy="72" r="4.5" />
        <circle cx="18" cy="72" r="4.5" />
        <circle cx="50" cy="90" r="4.5" />
      </g>
      <circle cx="50" cy="56" r="6.5" fill="#8CF5DD" />
      <circle cx="50" cy="56" r="11" fill="none" stroke="#38E8B0" strokeWidth="1.6" opacity="0.5" />
    </svg>
  );
}

/*
  Full lockup: mark + wordmark. `Lead` + accented `AI` + muted `Studio`.
  Defaults suit a dark surface; pass `wordClass` to recolor on light backgrounds.
*/
export default function Logo({
  size = 34,
  withWordmark = true,
  className = "",
  wordClass = "text-white",
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  wordClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className={`font-display font-extrabold tracking-tight text-[15px] leading-none ${wordClass}`}>
          Lead<span className="text-[#38E8B0]">AI</span>
          <span className="text-slate-400 font-bold">Studio</span>
        </span>
      )}
    </span>
  );
}
