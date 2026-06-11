interface Props {
  pct: number;       // 0..100
  size: number;      // px
  color: string;     // stroke color
  label?: string;    // center text
  sublabel?: string; // small text under label
}

export function ProgressRing({ pct, size, color, label, sublabel }: Props) {
  const r = 15.9;
  const dash = `${pct},100`;

  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* Track */}
      <circle
        cx="18" cy="18" r={r}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="3.2"
      />
      {/* Progress */}
      <circle
        cx="18" cy="18" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray={dash}
        strokeDashoffset="0"
        className="ring-progress"
        transform="rotate(-90 18 18)"
      />
      {label && (
        <text
          x="18" y={sublabel ? "16.5" : "19"}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={label.length > 5 ? "4.5" : "5.5"}
          fontWeight="800"
          fontFamily="inherit"
        >
          {label}
        </text>
      )}
      {sublabel && (
        <text
          x="18" y="22"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#888"
          fontSize="3.5"
          fontFamily="inherit"
        >
          {sublabel}
        </text>
      )}
    </svg>
  );
}
