/* eslint-disable @next/next/no-img-element */
// Ikon IMARIX (masjid dalam gerbang, bulan sabit dan bintang). Fail: public/brand/imarix-icon.png
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/brand/imarix-icon.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * 0.8)}
      height={size}
      style={{ width: Math.round(size * 0.8), height: size, objectFit: "contain" }}
    />
  );
}
