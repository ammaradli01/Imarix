import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
export const metadata: Metadata = { title: "Notis Privasi — IMARIX" };
export default function Privasi() {
  return (
    <LegalPage title="Notis Privasi">
      <h2>Siapa kami</h2><p>IMARIX dikendalikan oleh Fathi Global. Notis ini menerangkan cara kami memproses data peribadi mengikut Akta Perlindungan Data Peribadi 2010.</p>
      <h2>Data yang dikumpul</h2><p>Nama, emel dan peranan pengguna; maklumat masjid atau surau; dan rekod kewangan yang dimasukkan oleh AJK. Kami tidak mengumpul data yang tidak diperlukan.</p>
      <h2>Tujuan</h2><p>Untuk menyediakan perkhidmatan pengurusan kewangan masjid, menjana laporan, mengeluarkan invois langganan dan memberi sokongan.</p>
      <h2>Siapa boleh melihat data</h2><p>Hanya pengguna yang dijemput ke akaun masjid tersebut, mengikut peranan masing-masing. Data setiap masjid diasingkan dan setiap perubahan direkod dalam log audit.</p>
      <h2>Hak anda</h2><p>Anda boleh meminta akses, pembetulan atau pemadaman data peribadi anda dengan menghubungi kami.</p>
    </LegalPage>
  );
}
