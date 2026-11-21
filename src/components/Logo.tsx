export function Logo({ size = 36 }: { size?: number }) {
  const pts = Array.from({ length: 16 }, (_, k) => {
    const a = (Math.PI / 8) * k - Math.PI / 2, r = k % 2 === 0 ? 20 : 14.8;
    return `${(22 + r * Math.cos(a)).toFixed(1)},${(22 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <polygon points={pts} fill="#1E7F55" />
      <circle cx="22" cy="22" r="8" fill="#F7FBF8" />
      <circle cx="25" cy="20" r="6" fill="#1E7F55" />
    </svg>
  );
}
