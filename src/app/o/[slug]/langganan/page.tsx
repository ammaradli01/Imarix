import { getOrgContext, msg } from "@/lib/org";
import { can } from "@/lib/roles";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { getSubscription, tarikh } from "@/lib/subscription";
import { PRICE, YEARLY_SAVING, FEATURES, rm, waLink } from "@/lib/pricing";
import { requestInvoice } from "./actions";

const STATUS: Record<string, [string, string]> = {
  percubaan: ["Percubaan percuma", "badge"], aktif: ["Aktif", "badge"], tamat: ["Tamat", "badge badge-m"], dibatalkan: ["Dibatalkan", "badge badge-n"],
};
const INV: Record<string, string> = { menunggu: "Menunggu bayaran", dibayar: "Dibayar", gagal: "Gagal", dibatalkan: "Dibatalkan" };

export default async function Langganan({ params, searchParams }:
  { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params; const m = msg(await searchParams);
  const { supabase, org, roles } = await getOrgContext(slug);
  const sub = await getSubscription(supabase, org.id);
  const manage = can.manageBilling(roles);
  const invoices = manage
    ? (await supabase.from("subscription_invoices").select("id, invoice_no, billing_cycle, amount_sen, status, created_at, paid_at")
        .eq("organization_id", org.id).order("created_at", { ascending: false }).limit(24)).data ?? []
    : [];
  const pending = invoices.find((i) => i.status === "menunggu");
  const [label, cls] = STATUS[sub.state];
  const wa = waLink(`Assalamualaikum, saya ingin menghantar bukti bayaran IMARIX untuk ${org.name}${pending ? ` (invois ${pending.invoice_no})` : ""}.`);
  return (
    <>
      <h1 className="page">Langganan</h1>
      <p className="sub">Satu pelan dengan semua ciri untuk {org.name}.</p>
      <Flash {...m} />

      <section className="card mb-5 sub-status">
        <div><span className={cls}>{label}</span>
          <h2 className="card-title" style={{ marginTop: 8 }}>
            {sub.state === "percubaan" && <>Baki percubaan: {sub.daysLeft} hari</>}
            {sub.state === "aktif" && <>Aktif sehingga {tarikh(sub.until)}</>}
            {sub.state === "tamat" && <>Langganan tamat pada {tarikh(sub.until)}</>}
            {sub.state === "dibatalkan" && <>Langganan dibatalkan</>}
          </h2>
          <p className="text-sm" style={{ color: "var(--mute)" }}>
            {sub.state === "percubaan" && <>Percubaan tamat pada {tarikh(sub.until)}. Tiada caj automatik.</>}
            {sub.state === "aktif" && <>Bayaran seterusnya hanya apabila anda memilih untuk menyambung.</>}
            {(sub.state === "tamat" || sub.state === "dibatalkan") && <>Data masjid anda selamat dan tidak dipadam. Buat bayaran untuk menyambung.</>}
          </p>
        </div>
      </section>

      {manage ? (
        <>
          <section className="sub-plans mb-5">
            {(["bulanan", "tahunan"] as const).map((c) => (
              <form key={c} action={requestInvoice.bind(null, slug, org.id)} className={`card sub-plan${c === "tahunan" ? " best" : ""}`}>
                <input type="hidden" name="cycle" value={c} />
                <div className="flex items-center justify-between gap-2"><b>{c === "bulanan" ? "Bulanan" : "Tahunan"}</b>
                  {c === "tahunan" && <span className="badge">Jimat {rm(YEARLY_SAVING)}</span>}</div>
                <div className="sub-amt">{rm(PRICE[c])}<small>/{c === "bulanan" ? "bulan" : "tahun"}</small></div>
                <p className="text-sm" style={{ color: "var(--mute)" }}>{c === "tahunan" ? `Bersamaan ${rm(Math.round(PRICE.tahunan / 12))} sebulan, dibayar sekali setahun.` : "Bayar setiap bulan. Tukar ke tahunan bila-bila masa."}</p>
                <SubmitButton className={c === "tahunan" ? "btn btn-pri" : "btn"} pendingText="Mengeluarkan invois…">
                  {pending?.billing_cycle === c ? "Lihat invois" : sub.state === "aktif" ? "Sambung tempoh" : "Pilih pelan ini"}
                </SubmitButton>
              </form>
            ))}
          </section>

          {pending && (
            <section className="card mb-5 sub-pay" id="bayar">
              <h2 className="card-title">Cara membayar invois {pending.invoice_no}</h2>
              <ol className="text-sm grid gap-2" style={{ paddingLeft: 18, listStyle: "decimal" }}>
                <li>Pindahkan <b>{rm(pending.amount_sen / 100)}</b> ke akaun Fathi Global. Butiran akaun akan dihantar bersama invois.</li>
                <li>Tulis nombor invois <b>{pending.invoice_no}</b> sebagai rujukan pindahan.</li>
                <li>Hantar bukti pindahan kepada kami. Langganan diaktifkan selepas bayaran disahkan diterima di bank.</li>
              </ol>
              <p className="text-xs mt-3" style={{ color: "var(--mute)" }}>Bayaran dalam talian (FPX) akan dibuka tidak lama lagi. Tangkapan skrin bukan bukti bayaran; status ditukar hanya selepas wang diterima.</p>
              {wa && <a className="btn btn-sm mt-3" href={wa} target="_blank" rel="noopener">Hantar bukti melalui WhatsApp</a>}
            </section>
          )}

          <section className="card" id="invois">
            <h2 className="card-title">Invois</h2>
            {invoices.length ? (
              <div className="overflow-x-auto"><table className="t"><thead><tr><th>No. invois</th><th>Tarikh</th><th>Pelan</th><th style={{ textAlign: "right" }}>Jumlah</th><th>Status</th></tr></thead>
                <tbody>{invoices.map((i) => (
                  <tr key={i.id}><td><b>{i.invoice_no}</b></td><td>{tarikh(i.created_at)}</td><td>{i.billing_cycle === "bulanan" ? "Bulanan" : "Tahunan"}</td>
                    <td style={{ textAlign: "right" }}>{rm(i.amount_sen / 100)}</td>
                    <td><span className={`badge${i.status === "menunggu" ? " badge-m" : i.status === "dibayar" ? "" : " badge-n"}`}>{INV[i.status]}</span></td></tr>
                ))}</tbody></table></div>
            ) : <p className="text-sm" style={{ color: "var(--mute)" }}>Belum ada invois. Pilih pelan di atas untuk mengeluarkan invois.</p>}
          </section>
        </>
      ) : (
        <section className="card"><p className="text-sm">Hanya Pentadbir, Nazir atau Bendahari boleh menguruskan langganan dan melihat invois.</p></section>
      )}

      <section className="card mt-5">
        <h2 className="card-title">Termasuk dalam pelan</h2>
        <ul className="mk-ticks sub-feat">{FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
      </section>
    </>
  );
}
