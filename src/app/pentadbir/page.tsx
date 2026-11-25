import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { currentUser, msg } from "@/lib/org";
import { Flash } from "@/components/Flash";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/SubmitButton";
import { rm } from "@/lib/pricing";
import { tarikh } from "@/lib/subscription";
import { ORG_TYPE_LABEL } from "@/lib/roles";
import { markPaid, cancelInvoice } from "./actions";

export const metadata: Metadata = { title: "Panel Pentadbir — IMARIX" };

type Inv = { id: string; invoice_no: string; org_name: string; org_slug: string; billing_cycle: string; amount_sen: number; status: string; created_at: string; paid_at: string | null; gateway_ref: string | null };
type Org = { id: string; name: string; slug: string; org_type: string; district: string | null; created_at: string; state: string; trial_ends_at: string; current_period_end: string | null; members: number; last_activity: string | null };

const ST: Record<string, string> = { percubaan: "Percubaan", aktif: "Aktif", tamat: "Tamat", dibatalkan: "Dibatalkan" };
const INV: Record<string, string> = { menunggu: "Menunggu", dibayar: "Dibayar", gagal: "Gagal", dibatalkan: "Dibatalkan" };

export default async function Pentadbir({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const m = msg(await searchParams);
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect("/login?next=/pentadbir");
  const { data: isAdmin } = await supabase.rpc("am_i_platform_admin");
  if (!isAdmin) notFound();

  const [{ data: invs }, { data: orgs }] = await Promise.all([supabase.rpc("admin_invoices"), supabase.rpc("admin_organizations")]);
  const invoices = (invs ?? []) as Inv[];
  const organizations = (orgs ?? []) as Org[];
  const pending = invoices.filter((i) => i.status === "menunggu");
  const paid = invoices.filter((i) => i.status === "dibayar");
  const count = (s: string) => organizations.filter((o) => o.state === s).length;
  const dayAgo = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null);

  return (
    <>
      <header className="topbar"><Logo /><b>Panel Pentadbir IMARIX</b><Link className="btn btn-sm" href="/app">Akaun saya</Link></header>
      <main className="main">
        <h1 className="page">Panel Pentadbir</h1>
        <p className="sub">Untuk Fathi Global sahaja. Panel ini menunjukkan langganan dan invois, bukan rekod kewangan masjid.</p>
        <Flash {...m} />

        <section className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {[["Masjid / surau", organizations.length], ["Aktif (berbayar)", count("aktif")], ["Percubaan", count("percubaan")], ["Tamat", count("tamat")], ["Invois menunggu", pending.length],
            ["Kutipan diterima", rm(paid.reduce((a, i) => a + i.amount_sen, 0) / 100)]].map(([k, v]) => (
            <div key={k as string} className="card"><div className="text-xs font-bold" style={{ color: "var(--mute)" }}>{k}</div><div className="serif" style={{ fontSize: 30, color: "var(--pri2)" }}>{v}</div></div>
          ))}
        </section>

        <section className="card mb-5">
          <h2 className="card-title">Invois menunggu bayaran ({pending.length})</h2>
          <p className="text-sm mb-3" style={{ color: "var(--mute)" }}>Tandakan dibayar hanya selepas wang <b>betul-betul masuk</b> ke akaun bank Fathi Global. Tangkapan skrin bukan bukti. Masukkan nombor rujukan dari penyata bank.</p>
          {pending.length === 0 ? <p className="text-sm">Tiada invois menunggu.</p> : (
            <div className="grid gap-3">{pending.map((i) => (
              <div key={i.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--solid)" }}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div><b>{i.invoice_no}</b> · {i.org_name}<br /><small style={{ color: "var(--mute)" }}>{i.billing_cycle === "bulanan" ? "Bulanan" : "Tahunan"} · dikeluarkan {tarikh(i.created_at)}</small></div>
                  <div className="serif" style={{ fontSize: 24, color: "var(--pri2)" }}>{rm(i.amount_sen / 100)}</div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 items-end">
                  <form action={markPaid} className="flex flex-wrap gap-2 items-end" style={{ flex: "1 1 320px" }}>
                    <input type="hidden" name="id" value={i.id} />
                    <label className="field" style={{ flex: "1 1 200px", margin: 0 }}>Rujukan bayaran bank<input className="input" name="ref" required minLength={3} maxLength={80} placeholder="cth. MBB 2611250001" /></label>
                    <SubmitButton className="btn btn-pri" pendingText="Menyimpan…">Tandakan dibayar</SubmitButton>
                  </form>
                  <form action={cancelInvoice}><input type="hidden" name="id" value={i.id} /><SubmitButton className="btn btn-sm" pendingText="…">Batalkan</SubmitButton></form>
                </div>
              </div>
            ))}</div>
          )}
        </section>

        <section className="card mb-5">
          <h2 className="card-title">Masjid dan surau ({organizations.length})</h2>
          <div className="overflow-x-auto"><table className="t"><thead><tr><th>Nama</th><th>Jenis</th><th>Langganan</th><th>Tamat / hingga</th><th style={{ textAlign: "right" }}>Ahli</th><th>Aktiviti terakhir</th></tr></thead>
            <tbody>{organizations.map((o) => { const d = dayAgo(o.last_activity); return (
              <tr key={o.id}><td><b>{o.name}</b><br /><small style={{ color: "var(--mute)" }}>{o.district ?? "—"} · daftar {tarikh(o.created_at)}</small></td>
                <td>{ORG_TYPE_LABEL[o.org_type as keyof typeof ORG_TYPE_LABEL] ?? o.org_type}</td>
                <td><span className={`badge${o.state === "tamat" ? " badge-m" : o.state === "dibatalkan" ? " badge-n" : ""}`}>{ST[o.state]}</span></td>
                <td>{tarikh(o.current_period_end ?? o.trial_ends_at)}</td>
                <td style={{ textAlign: "right" }}>{o.members}</td>
                <td>{d === null ? "—" : d === 0 ? "Hari ini" : `${d} hari lalu`}{d !== null && d >= 14 && <span className="badge badge-m" style={{ marginLeft: 6 }}>Perlu dihubungi</span>}</td></tr>
            ); })}</tbody></table></div>
        </section>

        <section className="card">
          <h2 className="card-title">Semua invois</h2>
          <div className="overflow-x-auto"><table className="t"><thead><tr><th>No.</th><th>Masjid</th><th>Pelan</th><th style={{ textAlign: "right" }}>Jumlah</th><th>Status</th><th>Rujukan</th></tr></thead>
            <tbody>{invoices.map((i) => (
              <tr key={i.id}><td><b>{i.invoice_no}</b><br /><small style={{ color: "var(--mute)" }}>{tarikh(i.created_at)}</small></td><td>{i.org_name}</td>
                <td>{i.billing_cycle === "bulanan" ? "Bulanan" : "Tahunan"}</td><td style={{ textAlign: "right" }}>{rm(i.amount_sen / 100)}</td>
                <td><span className={`badge${i.status === "menunggu" ? " badge-m" : i.status === "dibayar" ? "" : " badge-n"}`}>{INV[i.status]}</span></td>
                <td>{i.gateway_ref ?? "—"}{i.paid_at && <><br /><small style={{ color: "var(--mute)" }}>{tarikh(i.paid_at)}</small></>}</td></tr>
            ))}</tbody></table></div>
        </section>
      </main>
    </>
  );
}
