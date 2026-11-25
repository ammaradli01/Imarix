/** Harga awam IMARIX. Harga sebenar yang dicaj ditetapkan di pangkalan data (app.plan_price). */
export const PRICE = { bulanan: 90, tahunan: 1000 } as const;
export type Cycle = keyof typeof PRICE;
export const TRIAL_DAYS = 30;
export const YEARLY_SAVING = PRICE.bulanan * 12 - PRICE.tahunan; // RM80

export const FEATURES = [
  "Kutipan tabung Jumaat dengan 3 pengira (BR-KMS 003)",
  "Resit rasmi dan baucar bayaran dengan kelulusan ikut had kuasa",
  "Buku Tunai automatik (BR-KMS 002)",
  "Penyata bank: AI kategorikan dan padankan transaksi",
  "Laporan BR-KMS 018, 019 dan 020 dalam satu klik",
  "Minit mesyuarat (BR-KMS 010)",
  "Skor Pematuhan mengikut garis panduan pejabat agama",
  "Jemput Nazir, Bendahari, Setiausaha, AJK dan Pemeriksa Kira-kira",
  "Log audit setiap perubahan",
  "Sokongan melalui WhatsApp",
];

/** Nombor WhatsApp perniagaan (format 60123456789). Kosong = butang WhatsApp disembunyikan. */
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, "") || "";
export const waLink = (text: string) => (WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}` : "");
export const rm = (n: number) => "RM" + n.toLocaleString("en-MY");
