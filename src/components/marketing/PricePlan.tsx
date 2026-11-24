"use client";
import Link from "next/link";
import { useState } from "react";
import { PRICE, FEATURES, TRIAL_DAYS, YEARLY_SAVING, rm, type Cycle } from "@/lib/pricing";

/** Kad harga dengan pilihan bulanan / tahunan. */
export function PricePlan({ compact = false }: { compact?: boolean }) {
  const [c, setC] = useState<Cycle>("tahunan");
  const list = compact ? FEATURES.slice(0, 6) : FEATURES;
  return (
    <div className="mk-price">
      <div className="mk-toggle" role="tablist" aria-label="Kitaran bayaran">
        <button role="tab" aria-selected={c === "bulanan"} className={c === "bulanan" ? "on" : ""} onClick={() => setC("bulanan")}>Bulanan</button>
        <button role="tab" aria-selected={c === "tahunan"} className={c === "tahunan" ? "on" : ""} onClick={() => setC("tahunan")}>Tahunan <span className="mk-save">Jimat {rm(YEARLY_SAVING)}</span></button>
      </div>
      <div className="mk-plan card">
        <div className="mk-plan-head">
          <div><span className="badge">Satu pelan, semua ciri</span><h3>IMARIX</h3><p>Untuk satu masjid atau surau</p></div>
          <div className="mk-amt"><b>{rm(PRICE[c])}</b><span>/{c === "bulanan" ? "bulan" : "tahun"}</span>
            <small>{c === "tahunan" ? `Bersamaan ${rm(Math.round(PRICE.tahunan / 12))} sebulan` : `atau ${rm(PRICE.tahunan)} setahun`}</small></div>
        </div>
        <ul className="mk-ticks">{list.map((f) => <li key={f}>{f}</li>)}<li className="soon">Khairat kematian <span className="badge badge-n">Akan datang</span></li></ul>
        <Link className="btn btn-pri mk-wide" href="/daftar">Mula percubaan {TRIAL_DAYS} hari</Link>
        <p className="mk-fine">Percuma {TRIAL_DAYS} hari. Tiada kad kredit diperlukan. Pilih bulanan atau tahunan selepas percubaan.</p>
      </div>
    </div>
  );
}
