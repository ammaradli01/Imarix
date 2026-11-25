import Link from "next/link";
import { TRIAL_DAYS } from "@/lib/pricing";

/** Susun atur dua panel untuk log masuk dan daftar. */
export function AuthShell({ children, mode }: { children: React.ReactNode; mode: "login" | "daftar" }) {
  return (
    <main className="au">
      <aside className="au-brand">
        <Link href="/" className="mk-brand au-logo" aria-label="IMARIX, laman utama">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/imarix-icon.png" alt="" width={34} height={42} />
          <span><b>IMARIX</b><small>Pengurusan Kewangan Masjid</small></span>
        </Link>
        <div>
          <h2>{mode === "daftar" ? <>Mula percuma {TRIAL_DAYS} hari. <em>Tanpa kad kredit.</em></> : <>Kewangan masjid, <em>sentiasa sedia diaudit.</em></>}</h2>
          <ul className="mk-ticks au-ticks">
            <li>Borang garis panduan pejabat agama dijana sendiri</li>
            <li>Kelulusan bayaran ikut had kuasa</li>
            <li>Data setiap masjid diasingkan dan dilog</li>
          </ul>
        </div>
        <small className="au-foot">© {new Date().getFullYear()} Fathi Global</small>
      </aside>
      <section className="au-form">
        <Link href="/" className="au-back">← Laman utama</Link>
        <div className="au-card">{children}</div>
      </section>
    </main>
  );
}
