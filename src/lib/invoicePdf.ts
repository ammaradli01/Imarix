import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BILLER, hasBank } from "@/lib/billing";
import { tarikh } from "@/lib/subscription";

const GREEN = rgb(0.059, 0.353, 0.235), INK = rgb(0.07, 0.15, 0.12), MUTE = rgb(0.34, 0.42, 0.38), LINE = rgb(0.84, 0.91, 0.87);
const money = (sen: number) => "RM" + (sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2 });
/** Huruf yang tidak dikenali fon standard PDF digantikan supaya tidak gagal. */
const safe = (s: string) => s.replace(/[—–]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");

export type InvOrg = { name: string; address: string | null; postcode: string | null; district: string | null; phone: string | null; email: string | null };
export type InvRow = { invoice_no: string; billing_cycle: string; amount_sen: number; status: string; created_at: string; paid_at: string | null; gateway_ref: string | null };

/** Bina PDF invois A4. */
export async function buildInvoicePdf(org: InvOrg, inv: InvRow): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invois ${inv.invoice_no}`); pdf.setAuthor(BILLER.name); pdf.setCreator("IMARIX");
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, L = 50, R = W - 50;
  const text = (t: string, x: number, y: number, o: { size?: number; f?: typeof font; color?: typeof INK; right?: boolean } = {}) => {
    const s = safe(t), size = o.size ?? 10, f = o.f ?? font;
    page.drawText(s, { x: o.right ? x - f.widthOfTextAtSize(s, size) : x, y, size, font: f, color: o.color ?? INK });
  };

  try {
    const png = await readFile(path.join(process.cwd(), "public/brand/imarix-logo.png"));
    const img = await pdf.embedPng(png); const w = 150, h = (img.height / img.width) * w;
    page.drawImage(img, { x: L, y: 800 - h, width: w, height: h });
  } catch { text("IMARIX", L, 780, { size: 22, f: bold, color: GREEN }); }

  let y = 735;
  text(BILLER.name + (BILLER.reg ? ` (${BILLER.reg})` : ""), L, y, { f: bold }); y -= 14;
  if (BILLER.address) { text(BILLER.address, L, y, { color: MUTE }); y -= 14; }
  const contact = [BILLER.phone, BILLER.email].filter(Boolean).join("  |  ");
  if (contact) text(contact, L, y, { color: MUTE });

  text("INVOIS", R, 780, { size: 26, f: bold, color: GREEN, right: true });
  const meta: [string, string][] = [["No. invois", inv.invoice_no], ["Tarikh", tarikh(inv.created_at)]];
  if (inv.status === "menunggu") meta.push(["Tarikh akhir", tarikh(new Date(new Date(inv.created_at).getTime() + 14 * 86_400_000))]);
  if (inv.paid_at) meta.push(["Dibayar", tarikh(inv.paid_at)]);
  let my = 755; for (const [k, v] of meta) { text(k, R - 120, my, { color: MUTE, right: true }); text(v, R, my, { f: bold, right: true }); my -= 14; }
  const stamp = ({ menunggu: "BELUM DIBAYAR", dibayar: "DIBAYAR", gagal: "GAGAL", dibatalkan: "DIBATALKAN" } as Record<string, string>)[inv.status] ?? "";
  const sc = inv.status === "dibayar" ? GREEN : inv.status === "menunggu" ? rgb(0.7, 0.42, 0) : MUTE;
  const sw = bold.widthOfTextAtSize(stamp, 11) + 16;
  page.drawRectangle({ x: R - sw, y: my - 10, width: sw, height: 20, borderColor: sc, borderWidth: 1.5 });
  text(stamp, R - 8, my - 4, { f: bold, size: 11, color: sc, right: true });

  page.drawLine({ start: { x: L, y: 680 }, end: { x: R, y: 680 }, thickness: 2, color: GREEN });

  y = 655;
  text("DIKELUARKAN KEPADA", L, y, { size: 8, f: bold, color: MUTE }); text("UNTUK", 320, y, { size: 8, f: bold, color: MUTE });
  y -= 16; text(org.name, L, y, { f: bold }); text("Langganan perisian IMARIX", 320, y);
  y -= 14; text([org.address, org.postcode, org.district].filter(Boolean).join(", ") || "-", L, y, { color: MUTE });
  text(`Kitaran: ${inv.billing_cycle === "bulanan" ? "Bulanan" : "Tahunan"}`, 320, y);
  if (org.phone || org.email) { y -= 14; text([org.phone, org.email].filter(Boolean).join("  |  "), L, y, { color: MUTE }); }

  y = 570;
  text("Perkara", L, y, { size: 9, f: bold, color: MUTE }); text("Kuantiti", 400, y, { size: 9, f: bold, color: MUTE, right: true }); text("Jumlah", R, y, { size: 9, f: bold, color: MUTE, right: true });
  page.drawLine({ start: { x: L, y: y - 6 }, end: { x: R, y: y - 6 }, thickness: 1, color: LINE });
  y -= 24; text(`Langganan IMARIX - ${inv.billing_cycle === "bulanan" ? "1 bulan" : "1 tahun"}`, L, y);
  text("1", 400, y, { right: true }); text(money(inv.amount_sen), R, y, { right: true });
  y -= 13; text(`Semua ciri, pengguna AJK tanpa had, untuk ${org.name}`, L, y, { size: 9, color: MUTE });
  page.drawLine({ start: { x: L, y: y - 10 }, end: { x: R, y: y - 10 }, thickness: 1, color: LINE });
  y -= 30; text("Jumlah perlu dibayar", L, y, { size: 12, f: bold }); text(money(inv.amount_sen), R, y, { size: 12, f: bold, right: true });

  y -= 40;
  if (inv.status === "menunggu") {
    page.drawRectangle({ x: L, y: y - 46, width: R - L, height: 62, color: rgb(0.87, 0.94, 0.89) });
    text("Cara bayaran", L + 12, y, { f: bold });
    text(hasBank() ? `Pindahan bank ke ${BILLER.bank}, no. akaun ${BILLER.account} (${BILLER.accountName}).` : "Butiran akaun bank akan dimaklumkan oleh Fathi Global.", L + 12, y - 16);
    text(`Tulis ${inv.invoice_no} sebagai rujukan pindahan. Langganan diaktifkan selepas bayaran disahkan diterima.`, L + 12, y - 30, { size: 9 });
  } else if (inv.status === "dibayar" && inv.gateway_ref) {
    text(`Rujukan bayaran: ${inv.gateway_ref}`, L, y, { f: bold });
  }
  text("Invois ini dijana oleh komputer dan tidak memerlukan tandatangan.", L, 60, { size: 8, color: MUTE });

  return pdf.save();
}
