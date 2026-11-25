import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { PRICE, TRIAL_DAYS, rm } from "@/lib/pricing";
export const metadata: Metadata = { title: "Terma Perkhidmatan — IMARIX" };
export default function Terma() {
  return (
    <LegalPage title="Terma Perkhidmatan">
      <h2>Perkhidmatan</h2><p>IMARIX ialah perisian pengurusan kewangan untuk masjid dan surau, disediakan oleh Fathi Global. IMARIX bukan produk rasmi mana-mana pejabat agama, dan tidak menggantikan semakan juruaudit atau kelulusan jawatankuasa.</p>
      <h2>Percubaan dan langganan</h2><p>Setiap organisasi baharu mendapat percubaan percuma {TRIAL_DAYS} hari. Selepas itu langganan ialah {rm(PRICE.bulanan)} sebulan atau {rm(PRICE.tahunan)} setahun bagi setiap masjid atau surau. Tiada caj automatik.</p>
      <h2>Pembatalan</h2><p>Langganan boleh dihentikan pada bila-bila masa; akses kekal sehingga tamat tempoh yang telah dibayar.</p>
      <h2>Tanggungjawab pengguna</h2><p>Jawatankuasa bertanggungjawab ke atas ketepatan rekod yang dimasukkan dan keputusan kelulusan yang dibuat.</p>
      <h2>Data</h2><p>Data masjid kekal milik masjid. Data tidak dipadam apabila langganan tamat, dan boleh dieksport atas permintaan.</p>
    </LegalPage>
  );
}
