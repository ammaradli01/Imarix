import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrgContext } from "@/lib/org";
import { can } from "@/lib/roles";
import { BILLER, hasBank } from "@/lib/billing";
import { rm } from "@/lib/pricing";
import { tarikh } from "@/lib/subscription";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Invois — IMARIX" };

const STATUS: Record<string, [string, string]> = {
  menunggu: ["BELUM DIBAYAR", "#B26A00"], dibayar: ["DIBAYAR", "#1E7F55"], gagal: ["GAGAL", "#B3261E"], dibatalkan: ["DIBATALKAN", "#6B7A73"],
};

export default async function Invois({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { supabase, org, roles } = await getOrgContext(slug);
  if (!can.manageBilling(roles)) notFound();
  const { data: inv } = await supabase.from("subscription_invoices")
    .select("id, invoice_no, billing_cycle, amount_sen, status, created_at, paid_at, gateway_ref")
    .eq("id", id).eq("organization_id", org.id).maybeSingle();
  if (!inv) notFound();

  const due = new Date(new Date(inv.created_at).getTime() + 14 * 86_400_000);
  const amount = inv.amount_sen / 100;
  const [stLabel, stColor] = STATUS[inv.status] ?? ["", "#000"];
  const orgAddr = [org.address, org.postcode, org.district].filter(Boolean).join(", ");

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link href={`/o/${slug}/langganan`} className="text-sm font-bold" style={{ color: "var(--pri)" }}>← Langganan</Link>
        <div className="flex gap-2"><a className="btn btn-pri btn-sm" href={`/o/${slug}/langganan/invois/${id}/pdf`}>Muat turun PDF</a><PrintButton /></div>
      </div>
      <article className="inv">
        <header className="inv-head">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/imarix-logo.png" alt="IMARIX" width={160} height={52} style={{ height: "auto", marginBottom: 12 }} />
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              <b>{BILLER.name}</b>{BILLER.reg && <> ({BILLER.reg})</>}<br />
              {BILLER.address && <>{BILLER.address}<br /></>}
              {[BILLER.phone, BILLER.email].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1>Invois</h1>
            <dl className="inv-meta" style={{ marginTop: 10 }}>
              <dt>No. invois</dt><dd>{inv.invoice_no}</dd>
              <dt>Tarikh</dt><dd>{tarikh(inv.created_at)}</dd>
              {inv.status === "menunggu" && <><dt>Tarikh akhir</dt><dd>{tarikh(due)}</dd></>}
              {inv.paid_at && <><dt>Dibayar</dt><dd>{tarikh(inv.paid_at)}</dd></>}
            </dl>
            <div className="inv-stamp" style={{ color: stColor, marginTop: 12 }}>{stLabel}</div>
          </div>
        </header>

        <section className="inv-parties">
          <div><b className="lbl">Dikeluarkan kepada</b><b>{org.name}</b><br />{orgAddr || <span style={{ color: "var(--mute)" }}>Alamat belum diisi dalam Profil Masjid</span>}
            {org.phone && <><br />{org.phone}</>}{org.email && <><br />{org.email}</>}</div>
          <div><b className="lbl">Untuk</b>Langganan perisian IMARIX<br />Kitaran: {inv.billing_cycle === "bulanan" ? "Bulanan" : "Tahunan"}</div>
        </section>

        <table>
          <thead><tr><th>Perkara</th><th className="r">Kuantiti</th><th className="r">Jumlah</th></tr></thead>
          <tbody>
            <tr><td>Langganan IMARIX — {inv.billing_cycle === "bulanan" ? "1 bulan" : "1 tahun"}<br />
              <small style={{ color: "var(--mute)" }}>Semua ciri, pengguna AJK tanpa had, untuk {org.name}</small></td>
              <td className="r">1</td><td className="r">{rm(amount)}.00</td></tr>
            <tr className="inv-total"><td>Jumlah perlu dibayar</td><td></td><td className="r">{rm(amount)}.00</td></tr>
          </tbody>
        </table>

        {inv.status === "menunggu" && (
          <div className="inv-pay">
            <b>Cara bayaran</b><br />
            {hasBank() ? <>Pindahan bank ke <b>{BILLER.bank}</b>, no. akaun <b>{BILLER.account}</b> ({BILLER.accountName}).<br /></>
              : <>Butiran akaun bank akan dimaklumkan oleh Fathi Global.<br /></>}
            Sila tulis <b>{inv.invoice_no}</b> sebagai rujukan pindahan. Langganan diaktifkan selepas bayaran disahkan diterima.
          </div>
        )}
        {inv.status === "dibayar" && inv.gateway_ref && <p className="inv-pay">Rujukan bayaran: <b>{inv.gateway_ref}</b></p>}

        <p className="inv-foot">Invois ini dijana oleh komputer dan tidak memerlukan tandatangan. Boleh direkod sebagai perbelanjaan pejabat masjid dengan baucar bayaran.</p>
      </article>
    </>
  );
}
