import { getOrgContext, msg } from "@/lib/org";
import { can, ROLE_HINT, ROLE_LABEL, ROLES, type Role } from "@/lib/roles";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { addRole, invite, removeRole, revokeInvite } from "./actions";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function Pengguna({ params, searchParams }:
  { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params; const sp = await searchParams; const m = msg(sp);
  const { supabase, org, roles, user } = await getOrgContext(slug);
  const manage = can.manageMembers(roles);
  const assignable = ROLES.filter((r) => r !== "org_admin" || can.appointAdmin(roles));

  const { data: ms } = await supabase.from("memberships").select("id, user_id, role, status, created_at").eq("organization_id", org.id).order("created_at");
  const ids = [...new Set((ms ?? []).map((x) => x.user_id))];
  const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids) : { data: [] };
  const people = ids.map((id) => ({ id, p: (profs ?? []).find((x) => x.id === id), rs: (ms ?? []).filter((x) => x.user_id === id) }));
  const invites = manage ? (await supabase.from("invitations").select("id, email, role, token, expires_at, created_at")
    .eq("organization_id", org.id).is("accepted_at", null).is("revoked_at", null).order("created_at", { ascending: false })).data ?? [] : [];
  const fresh = sp.baru;

  return (
    <>
      <h1 className="page">Pengguna dan peranan</h1>
      <p className="sub">Setiap pengguna boleh ada lebih daripada satu peranan. Pengguna tidak boleh mengubah peranan sendiri, dan penyedia baucer tidak boleh meluluskannya.</p>
      <Flash {...m} />
      {fresh && <div className="card mb-5" style={{ borderColor: "var(--pri)" }}>
        <b>Pautan jemputan</b><p className="text-sm my-2 break-all" style={{ color: "var(--mute)" }}>{site()}/jemputan/{fresh}</p>
        <CopyButton text={`${site()}/jemputan/${fresh}`} /> <span className="text-xs ml-2" style={{ color: "var(--mute)" }}>Sah selama 7 hari. Penerima mesti log masuk dengan emel yang dijemput.</span>
      </div>}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <h2 className="card-title">Ahli ({people.length})</h2>
          <div className="grid gap-3">
            {people.map(({ id, p, rs }) => (
              <div key={id} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--solid)" }}>
                <div className="flex flex-wrap justify-between gap-2"><b>{p?.full_name || "(tiada nama)"}{id === user.id && " (anda)"}</b><small style={{ color: "var(--mute)" }}>{p?.phone}</small></div>
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  {rs.map((r) => (
                    <span key={r.id} className="badge inline-flex items-center gap-1">{ROLE_LABEL[r.role as Role]}
                      {manage && id !== user.id && (r.role !== "org_admin" || can.appointAdmin(roles)) && (
                        <form action={removeRole.bind(null, slug, r.id)} className="inline"><button type="submit" aria-label={`Buang peranan ${ROLE_LABEL[r.role as Role]}`} className="ml-1 font-bold cursor-pointer" style={{ color: "var(--red)" }}>×</button></form>
                      )}
                    </span>
                  ))}
                  {manage && id !== user.id && (
                    <form action={addRole.bind(null, slug, org.id, id)} className="inline-flex gap-1 items-center">
                      <select name="role" className="input" style={{ minHeight: 34, padding: "4px 8px", fontSize: 13, width: "auto" }} aria-label="Peranan baharu">
                        {assignable.filter((r) => !rs.some((x) => x.role === r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                      <SubmitButton className="btn btn-sm" pendingText="…">+ Peranan</SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="grid gap-5 content-start">
          {manage ? (
            <section className="card">
              <h2 className="card-title">Jemput pengguna</h2>
              <form action={invite.bind(null, slug, org.id)} className="grid gap-3">
                <label className="field">Emel<input className="input" type="email" name="email" required /></label>
                <label className="field">Peranan
                  <select className="input" name="role" defaultValue="committee">
                    {assignable.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]} — {ROLE_HINT[r]}</option>)}
                  </select>
                </label>
                <SubmitButton pendingText="Mencipta…">Cipta jemputan</SubmitButton>
              </form>
              {invites.length > 0 && <>
                <h3 className="font-bold text-sm mt-6 mb-2">Jemputan belum diterima</h3>
                <div className="grid gap-2">{invites.map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                    <span><b>{i.email}</b><br /><small style={{ color: "var(--mute)" }}>{ROLE_LABEL[i.role as Role]} · tamat {new Date(i.expires_at).toLocaleDateString("ms-MY")}</small></span>
                    <span className="flex gap-1"><CopyButton text={`${site()}/jemputan/${i.token}`} label="Salin" />
                      <form action={revokeInvite.bind(null, slug, i.id)}><SubmitButton className="btn btn-sm btn-danger" pendingText="…">Batal</SubmitButton></form></span>
                  </div>))}</div>
              </>}
            </section>
          ) : <section className="card text-sm">Hanya Pentadbir atau Nazir boleh menjemput pengguna dan mengubah peranan.</section>}
          <section className="card text-sm">
            <h2 className="card-title">Maksud setiap peranan</h2>
            <ul className="grid gap-2">{ROLES.map((r) => <li key={r}><b>{ROLE_LABEL[r]}</b> — <span style={{ color: "var(--mute)" }}>{ROLE_HINT[r]}</span></li>)}</ul>
          </section>
        </div>
      </div>
    </>
  );
}
