import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PricePlan } from "@/components/marketing/PricePlan";
import { PRICE, TRIAL_DAYS, rm, waLink } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Harga — IMARIX",
  description: `IMARIX ${rm(PRICE.bulanan)} sebulan atau ${rm(PRICE.tahunan)} setahun untuk satu masjid atau surau. Percuma ${TRIAL_DAYS} hari.`,
};

const BANDING = [
  ["Kutipan Jumaat, resit dan baucar", "✓"], ["Buku Tunai dan penyesuaian bank", "✓"], ["Laporan BR-KMS 018, 019, 020", "✓"],
  ["Minit mesyuarat", "✓"], ["Skor Pematuhan garis panduan", "✓"], ["Imbas invois dengan AI", "✓"],
  ["Bilangan pengguna AJK", "Tiada had"], ["Log audit", "✓"], ["Khairat kematian", "Akan datang"],
];
const SOALAN = [
  ["Bagaimana cara membayar?", "Selepas percubaan, Pentadbir, Nazir atau Bendahari memilih bulanan atau tahunan di halaman Langganan dalam akaun masjid. Invois dikeluarkan atas nama masjid. Buat masa ini bayaran dibuat melalui pindahan bank; bayaran dalam talian FPX akan dibuka tidak lama lagi."],
  ["Boleh bayar menggunakan wang masjid?", "Boleh. Invois dan resit dikeluarkan atas nama masjid atau surau supaya boleh direkod sebagai perbelanjaan pejabat dengan baucar bayaran."],
  ["Bolehkah tukar dari bulanan ke tahunan?", "Boleh. Tempoh baharu bermula selepas tempoh semasa tamat, jadi tiada hari yang hilang."],
  ["Apa berlaku jika langganan tamat?", "Data masjid anda tidak dipadam. Akaun boleh diaktifkan semula bila-bila masa dengan membuat bayaran."],
  ["Ada harga khas untuk surau di bawah masjid?", "Hubungi kami jika masjid anda ingin mendaftarkan beberapa surau di bawah kariahnya."],
];

export default function HargaPage() {
  const wa = waLink("Assalamualaikum, saya ingin bertanya tentang harga IMARIX untuk masjid dan surau di bawahnya.");
  return (
    <div className="mk">
      <SiteHeader />
      <section className="mk-sec mk-wrap mk-pricewrap" style={{ paddingTop: 48 }}>
        <div className="mk-head"><span className="mk-eyebrow">Harga</span><h1 className="mk-h1">Satu pelan. <em>Semua ciri.</em></h1>
          <p>Harga sama untuk masjid dan surau. Cuba percuma {TRIAL_DAYS} hari dahulu, tanpa kad kredit.</p></div>
        <PricePlan />
      </section>
      <section className="mk-sec mk-wrap">
        <div className="mk-head"><h2>Apa yang <em>termasuk</em></h2></div>
        <div className="card mk-table"><table><tbody>{BANDING.map(([k, v]) => <tr key={k}><td>{k}</td><td className={v === "✓" ? "ok" : ""}>{v}</td></tr>)}</tbody></table></div>
      </section>
      <section className="mk-sec mk-wrap">
        <div className="mk-head"><h2>Soalan tentang <em>bayaran</em></h2></div>
        <div className="mk-faq">{SOALAN.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>
      <section className="mk-wrap mk-final">
        <h2>Mula hari ini, bayar selepas {TRIAL_DAYS} hari</h2>
        <p>Tiada caj automatik selepas percubaan.</p>
        <div className="mk-actions"><Link className="btn mk-big mk-light" href="/daftar">Cuba percuma</Link>
          {wa && <a className="btn mk-big mk-ghost" href={wa} target="_blank" rel="noopener">Tanya melalui WhatsApp</a>}</div>
      </section>
      <SiteFooter />
    </div>
  );
}
