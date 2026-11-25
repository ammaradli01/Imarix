import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mk-foot">
      <div className="mk-wrap mk-foot-in">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/imarix-logo.png" alt="IMARIX — Smart Mosque Management System" width={180} height={58} style={{ height: "auto" }} />
          <p>Sistem kewangan masjid dan surau mengikut Garis Panduan Pengurusan Kewangan, Perolehan dan Aset Masjid dan Surau Negeri Selangor 2023.</p>
        </div>
        <div><b>Produk</b><Link href="/#ciri">Ciri</Link><Link href="/harga">Harga</Link><Link href="/#soalan">Soalan lazim</Link></div>
        <div><b>Akaun</b><Link href="/daftar">Daftar percuma</Link><Link href="/login">Log masuk</Link></div>
        <div><b>Syarikat</b><span>Fathi Global</span><Link href="/privasi">Notis privasi</Link><Link href="/terma">Terma perkhidmatan</Link></div>
      </div>
      <div className="mk-wrap mk-copy">© {new Date().getFullYear()} Fathi Global. IMARIX ialah produk Fathi Global. Bukan produk rasmi mana-mana pejabat agama.</div>
    </footer>
  );
}
