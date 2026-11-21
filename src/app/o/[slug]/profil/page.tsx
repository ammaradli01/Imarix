import { getOrgContext, msg } from "@/lib/org";
import { can, ORG_TYPE_LABEL } from "@/lib/roles";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { addBank, deleteBank, updateOrg } from "./actions";

const BULAN = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

export default async function Profil({ params, searchParams }:
  { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params; const m = msg(await searchParams);
  const { supabase, org, roles } = await getOrgContext(slug);
  const edit = can.editProfile(roles);
  const banks = can.viewBank(roles)
    ? (await supabase.from("bank_accounts").select("*").eq("organization_id", org.id).order("is_primary", { ascending: false })).data ?? []
    : null;
  const f = (name: keyof typeof org, label: string, extra: Record<string, unknown> = {}, hint?: string) => (
    <label className="field">{label}
      <input className="input" name={name} defaultValue={(org[name] as string) ?? ""} disabled={!edit} {...extra} />
      {hint && <small>{hint}</small>}
    </label>
  );
  return (
    <>
      <h1 className="page">Profil masjid</h1>
      <p className="sub">Maklumat ini dipaparkan pada resit, baucer dan semua laporan rasmi. {edit ? "Setiap perubahan direkod dalam log audit." : "Hanya Pentadbir, Nazir atau Setiausaha boleh mengubahnya."}</p>
      <Flash {...m} />
      <section className="card mb-5">
        <form action={updateOrg.bind(null, slug, org.id)} className="grid gap-4">
          <div className="form-grid">
            {f("name", "Nama masjid / surau", { required: true, minLength: 3, maxLength: 150 })}
            <label className="field">Jenis
              <select className="input" name="org_type" defaultValue={org.org_type} disabled={!edit}>
                {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {f("registration_no", "No. pendaftaran / rujukan MAIS")}
          </div>
          <label className="field">Alamat<textarea className="input" name="address" rows={2} defaultValue={org.address ?? ""} disabled={!edit} maxLength={300} /></label>
          <div className="form-grid">
            {f("postcode", "Poskod", { inputMode: "numeric", pattern: "[0-9]{5}" })}
            {f("district", "Daerah", {}, "Untuk penghantaran laporan ke Pejabat Agama Islam Daerah")}
            {f("phone", "Telefon", { type: "tel" })}
            {f("email", "Emel masjid", { type: "email" })}
            {f("receipt_prefix", "Awalan nombor resit", { pattern: "[A-Za-z0-9]{1,4}" }, "cth. A → A01001")}
            <label className="field">Tahun kewangan bermula
              <select className="input" name="fiscal_year_start" defaultValue={org.fiscal_year_start} disabled={!edit}>
                {BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
              </select><small>Garis Panduan MAIS: 1 Januari – 31 Disember</small>
            </label>
          </div>
          {edit && <div><SubmitButton>Simpan profil</SubmitButton></div>}
        </form>
      </section>

      {banks && (
        <section className="card" id="bank">
          <h2 className="card-title">Akaun bank</h2>
          <p className="text-sm -mt-2 mb-4" style={{ color: "var(--mute)" }}>Satu akaun semasa perbankan Islam sahaja. Akaun tambahan perlu kebenaran bertulis MAIS (SOP 8.2.1). Nombor akaun hanya dilihat oleh Pentadbir, Nazir, Bendahari dan Pemeriksa.</p>
          {banks.length > 0 ? (
            <div className="overflow-x-auto mb-4"><table className="t"><thead><tr><th>Bank</th><th>Nama akaun</th><th>No. akaun</th><th></th><th></th></tr></thead><tbody>
              {banks.map((b) => (
                <tr key={b.id}><td>{b.bank_name}</td><td>{b.account_name}</td><td className="tabular-nums">{b.account_no}</td>
                  <td>{b.is_primary ? <span className="badge">Utama</span> : <span className="badge badge-m">Kebenaran MAIS: {b.mais_approval_ref}</span>}</td>
                  <td>{can.deleteBank(roles) && <form action={deleteBank.bind(null, slug, b.id)}><SubmitButton className="btn btn-sm btn-danger" pendingText="…">Buang</SubmitButton></form>}</td></tr>
              ))}</tbody></table></div>
          ) : <p className="text-sm mb-4">Belum ada akaun bank.</p>}
          {can.manageBank(roles) && (
            <form action={addBank.bind(null, slug, org.id)} className="form-grid items-end">
              <label className="field">Bank<input className="input" name="bank_name" required placeholder="cth. Bank Islam" /></label>
              <label className="field">Nama akaun<input className="input" name="account_name" required defaultValue={org.name} /></label>
              <label className="field">No. akaun<input className="input" name="account_no" required inputMode="numeric" /></label>
              {banks.length > 0 && <label className="field">Rujukan kebenaran MAIS<input className="input" name="mais_approval_ref" required /></label>}
              <div><SubmitButton>Tambah akaun</SubmitButton></div>
            </form>
          )}
        </section>
      )}
    </>
  );
}
