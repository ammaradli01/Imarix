/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PricePlan } from "@/components/marketing/PricePlan";
import { TRIAL_DAYS, PRICE, rm, waLink } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "IMARIX — Sistem Kewangan Masjid & Surau ikut Garis Panduan Pejabat Agama",
  description: "Rekod kutipan Jumaat, resit, baucar dan minit mesyuarat. IMARIX menjana laporan borang BR-KMS dan menyemak pematuhan sebelum audit. Percuma 30 hari.",
};

const FOKUS = [
  { t: "Kewangan harian", d: "Kutipan tabung Jumaat, resit rasmi, baucar bayaran dan Buku Tunai yang dikemas kini sendiri.", tag: "BR-KMS 002 · 003 · 005 · 007" },
  { t: "Laporan ke pejabat agama", d: "Laporan bulanan dan berkala, Penyata Kewangan Tahunan dan penyesuaian bank dalam format asal.", tag: "BR-KMS 018 · 019 · 020" },
  { t: "Minit mesyuarat", d: "Rekod kehadiran dan keputusan; laporan kewangan diisi terus daripada buku tunai.", tag: "BR-KMS 010" },
  { t: "Khairat kematian", d: "Ahli, yuran, tuntutan dan bantuan kematian dalam satu tempat.", tag: "Akan datang", soon: true },
];

const CIRI = [
  { img: "/landing/kutipan_card.webp", w: 907, h: 1600, k: "Kutipan Jumaat", t: "Kira tabung terus di telefon", d: "Masukkan bilangan wang ikut denominasi; jumlah dikira sendiri. Tiga pengira direkod, dan sistem mengingatkan jika kutipan melebihi RM1,000 belum dibankkan.", pts: ["Penyata Kutipan Tabung (BR-KMS 003) dijana sendiri", "Penyata mingguan untuk papan kenyataan"] },
  { img: "/landing/baucer_card.webp", w: 1196, h: 1600, k: "Baucar & kelulusan", t: "Imbas invois, AI isi baucar", d: "Ambil gambar invois. IMARIX mengisi baucar, menentukan kaedah perolehan dan pelulus ikut had kuasa, dan memberi amaran sebelum disimpan.", pts: ["Pembuat dan pelulus tidak boleh orang yang sama", "Nazir lulus terus dalam aplikasi"] },
  { img: "/landing/borangU.webp", w: 1442, h: 1600, k: "Laporan", t: "Penyata tahunan dalam satu klik", d: "Penyata Kewangan Tahunan (BR-KMS 019) lengkap dengan nombor nota, terus daripada rekod harian. Tiada salin semula angka setiap 6 bulan.", pts: ["Laporan berkala sebelum 31 Ogos", "Penyata tahunan sebelum 30 Jun"] },
];

const SOALAN = [
  ["Adakah laporan IMARIX ikut format pejabat agama?", "Ya. Borang dijana mengikut lampiran Garis Panduan Pengurusan Kewangan, Perolehan dan Aset Masjid dan Surau Negeri Selangor 2023 (BR-KMS). IMARIX ialah produk Fathi Global dan bukan produk rasmi mana-mana pejabat agama."],
  ["Perlu pasang aplikasi?", "Tidak. IMARIX dibuka melalui pelayar web di telefon, tablet atau komputer."],
  ["Siapa yang boleh menggunakan akaun masjid?", "Pentadbir menjemput Nazir, Bendahari, Setiausaha, AJK dan Pemeriksa Kira-kira. Setiap orang hanya nampak apa yang dibenarkan oleh peranannya."],
  ["Adakah data masjid selamat?", "Data setiap masjid diasingkan di peringkat pangkalan data, setiap perubahan direkod dalam log audit, dan nombor akaun bank disorok dalam log."],
  ["Boleh digunakan oleh surau?", "Boleh. Garis panduan yang sama terpakai kepada surau, dan harga adalah sama untuk masjid dan surau."],
  ["Apa berlaku selepas percubaan 30 hari?", "Tiada caj automatik. Pentadbir, Nazir atau Bendahari memilih langganan bulanan atau tahunan di halaman Langganan untuk terus menggunakan IMARIX."],
];

export default function Landing() {
  const wa = waLink("Assalamualaikum, saya ingin tahu tentang IMARIX untuk masjid/surau kami.");
  return (
    <div className="mk">
      <SiteHeader />

      <section className="mk-hero mk-wrap">
        <div className="mk-hero-txt">
          <span className="mk-eyebrow">Untuk masjid & surau di Selangor</span>
          <h1>Kewangan masjid tersusun, <em>laporan pejabat agama sedia</em> bila diminta.</h1>
          <p className="mk-lead">Rekod kutipan Jumaat, resit, baucar dan minit mesyuarat di telefon. IMARIX menjana borang mengikut garis panduan pejabat agama dan menyemak pematuhan sebelum audit.</p>
          <div className="mk-badges"><span>✓ Ikut garis panduan pejabat agama</span><span>✓ Percuma {TRIAL_DAYS} hari</span><span>✓ Tanpa kad kredit</span></div>
          <div className="mk-actions">
            <Link className="btn btn-pri mk-big" href="/daftar">Cuba percuma {TRIAL_DAYS} hari</Link>
            <Link className="btn mk-big" href="/harga">Lihat harga</Link>
          </div>
        </div>
        <div className="mk-hero-img" aria-hidden="true">
          <img className="mk-shot-desk" src="/landing/dash.webp" alt="" width={1600} height={1000} />
          <img className="mk-shot-phone" src="/landing/mobile.webp" alt="" width={739} height={1600} />
        </div>
      </section>

      <section className="mk-facts mk-wrap" aria-label="Ringkasan">
        <div><b>20</b><span>borang kewangan BR-KMS dijana sendiri</span></div>
        <div><b>{rm(PRICE.bulanan)}</b><span>sebulan, semua ciri, satu harga</span></div>
        <div><b>{TRIAL_DAYS} hari</b><span>percubaan percuma tanpa kad kredit</span></div>
        <div><b>3 klik</b><span>dari rekod harian ke penyata tahunan</span></div>
      </section>

      <section id="ciri" className="mk-sec mk-wrap">
        <div className="mk-head"><span className="mk-eyebrow">Fokus IMARIX</span><h2>Bukan sistem serba-serbi. <em>Kewangan masjid, dibuat betul.</em></h2>
          <p>IMARIX menumpukan kepada kerja yang paling berat untuk AJK: wang masuk, wang keluar, dan laporan yang perlu dihantar.</p></div>
        <div className="mk-grid4">
          {FOKUS.map((f) => (
            <div key={f.t} className={`mk-card card${f.soon ? " mk-soon" : ""}`}>
              <h3>{f.t}</h3><p>{f.d}</p><span className={`badge${f.soon ? " badge-n" : ""}`}>{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {CIRI.map((c, i) => (
        <section key={c.t} className={`mk-row mk-wrap${i % 2 ? " rev" : ""}`}>
          <div className="mk-row-img"><img src={c.img} alt={c.t} width={c.w} height={c.h} loading="lazy" /></div>
          <div className="mk-row-txt">
            <span className="mk-eyebrow">{c.k}</span><h2>{c.t}</h2><p>{c.d}</p>
            <ul className="mk-ticks">{c.pts.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </section>
      ))}

      <section className="mk-sec mk-wrap">
        <div className="mk-band">
          <div><span className="mk-eyebrow">Skor Pematuhan</span><h2>Tahu apa yang salah <em>sebelum juruaudit tahu</em></h2>
            <p>Setiap rekod disemak mengikut klausa garis panduan: kutipan lewat dibankkan, bayaran tanpa kelulusan, perolehan tanpa sebut harga, laporan lewat. Semua dikumpul dalam satu skor 0–100.</p></div>
          <div className="mk-score" aria-label="Contoh skor pematuhan 86 daripada 100"><b>86</b><span>/100</span><small>contoh paparan</small></div>
        </div>
      </section>

      <section id="cara-mula" className="mk-sec mk-wrap">
        <div className="mk-head"><span className="mk-eyebrow">Cara mula</span><h2>Siap digunakan <em>dalam satu petang</em></h2></div>
        <ol className="mk-steps">
          <li><b>Daftar akaun</b><span>Isi nama, emel dan kata laluan. Kurang 2 minit.</span></li>
          <li><b>Daftar masjid atau surau</b><span>Nama, daerah, akaun bank dan baki awal 1 Januari.</span></li>
          <li><b>Jemput AJK dan mula rekod</b><span>Jemput Nazir dan Bendahari melalui pautan. Kami bantu set up dan latih Bendahari.</span></li>
        </ol>
      </section>

      <section className="mk-sec mk-wrap mk-roles">
        <div className="mk-head"><span className="mk-eyebrow">Untuk siapa</span><h2>Setiap AJK, <em>peranan sendiri</em></h2></div>
        <div className="mk-grid4">
          <div className="mk-card card"><h3>Bendahari</h3><p>Rekod kutipan, resit dan baucar; laporan siap tanpa menyalin semula.</p></div>
          <div className="mk-card card"><h3>Nazir</h3><p>Luluskan bayaran di telefon dan pantau skor pematuhan.</p></div>
          <div className="mk-card card"><h3>Setiausaha</h3><p>Minit mesyuarat dengan laporan kewangan terkini.</p></div>
          <div className="mk-card card"><h3>Pemeriksa Kira-kira</h3><p>Akses baca sahaja untuk menyemak rekod dan dokumen.</p></div>
        </div>
      </section>

      <section id="harga" className="mk-sec mk-wrap mk-pricewrap">
        <div className="mk-head"><span className="mk-eyebrow">Harga</span><h2>Satu harga, <em>semua ciri</em></h2><p>Sama untuk masjid dan surau. <Link href="/harga">Lihat butiran harga</Link></p></div>
        <PricePlan compact />
      </section>

      <section id="soalan" className="mk-sec mk-wrap">
        <div className="mk-head"><span className="mk-eyebrow">Soalan lazim</span><h2>Soalan yang <em>selalu ditanya</em></h2></div>
        <div className="mk-faq">{SOALAN.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <section className="mk-wrap mk-final">
        <h2>Jadi antara masjid perintis IMARIX</h2>
        <p>Kami sedang bekerjasama dengan masjid dan surau di Selangor. Daftar sekarang, atau hubungi kami untuk demo di masjid anda.</p>
        <div className="mk-actions">
          <Link className="btn mk-big mk-light" href="/daftar">Cuba percuma {TRIAL_DAYS} hari</Link>
          {wa && <a className="btn mk-big mk-ghost" href={wa} target="_blank" rel="noopener">WhatsApp kami</a>}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
