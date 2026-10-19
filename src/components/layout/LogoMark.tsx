/** Znak SONORA: fala dźwiękowa na fioletowym tle. Prosty kształt geometryczny, bez użycia cudzych znaków. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <defs>
        <linearGradient id="sonora-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9d85ff" />
          <stop offset="100%" stopColor="#5b3fd9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sonora-mark)" />
      <path
        d="M7 16c2.2-6 4.4-6 6.6 0s4.4 6 6.6 0 2.9-4.2 4.8-2.4"
        fill="none"
        stroke="#f7f5ff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="25" cy="13.4" r="1.6" fill="#3dd6c6" />
    </svg>
  );
}
