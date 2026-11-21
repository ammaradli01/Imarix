import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { can, ROLE_LABEL, type Role } from "@/lib/roles";

const ENT: Record<string, string> = { organizations: "Profil masjid", memberships: "Peranan", invitations: "Jemputan", bank_accounts: "Akaun bank" };
const ACT: Record<string, string> = { INSERT: "Tambah", UPDATE: "Ubah", DELETE: "Buang" };
const SKIP = new Set(["id", "organization_id", "created_at", "updated_at", "created_by", "invited_by", "user_id", "accepted_by"]);

type Row = { id: number; actor_id: string | null; action: string; entity: string; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null; created_at: string };

function describe(r: Row) {
  const o = r.old_data ?? {}, n = r.new_data ?? {};
  if (r.entity === "memberships") return `${ROLE_LABEL[(n.role ?? o.role) as Role] ?? ""}${r.action === "UPDATE" ? ` (status: ${o.status} → ${n.status})` : ""}`;
  if (r.entity === "invitations") return `${n.email ?? o.email} sebagai ${ROLE_LABEL[(n.role ?? o.role) as Role] ?? ""}${n.accepted_at ? " — diterima" : n.revoked_at ? " — dibatalkan" : ""}`;
  if (r.action === "UPDATE") return Object.keys(n).filter((k) => !SKIP.has(k) && JSON.stringify(o[k]) !== JSON.stringify(n[k]))
    .map((k) => `${k}: "${o[k] ?? ""}" → "${n[k] ?? ""}"`).join("; ");
  const d = r.action === "DELETE" ? o : n;
  return Object.entries(d).filter(([k, v]) => !SKIP.has(k) && v !== null && v !== "").slice(0, 4).map(([k, v]) => `${k}: ${v}`).join("; ");
}

export default async function Audit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, org, roles } = await getOrgContext(slug);
  if (!can.viewAudit(roles)) notFound();
  const { data } = await supabase.from("audit_logs").select("id, actor_id, action, entity, old_data, new_data, created_at")
    .eq("organization_id", org.id).order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as Row[];
  const ids = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const who = (id: string | null) => (profs ?? []).find((p) => p.id === id)?.full_name ?? (id ? "Pengguna lain" : "Sistem");
  return (
    <>
      <h1 className="page">Log audit</h1>
      <p className="sub">Setiap perubahan pada profil masjid, akaun bank, peranan dan jemputan direkod secara automatik oleh pangkalan data. Log ini tidak boleh diubah atau dipadam. 200 rekod terkini.</p>
      <section className="card overflow-x-auto">
        <table className="t"><thead><tr><th>Masa</th><th>Oleh</th><th>Tindakan</th><th>Perkara</th><th>Butiran</th></tr></thead><tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{new Date(r.created_at).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "short", timeStyle: "short" })}</td>
              <td>{who(r.actor_id)}</td><td><span className="badge badge-n">{ACT[r.action] ?? r.action}</span></td>
              <td>{ENT[r.entity] ?? r.entity}</td><td className="text-sm" style={{ color: "var(--mute)" }}>{describe(r)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5}>Belum ada rekod.</td></tr>}
        </tbody></table>
      </section>
    </>
  );
}
