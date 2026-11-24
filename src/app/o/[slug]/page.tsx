import Link from "next/link";
import { getOrgContext, msg } from "@/lib/org";
import { ROLE_LABEL, can } from "@/lib/roles";
import { Flash } from "@/components/Flash";

export default async function OrgHome({ params, searchParams }:
  { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params; const m = msg(await searchParams);
  const { supabase, org, roles, profile } = await getOrgContext(slug);
  const [{ count: members }, { data: bank }] = await Promise.all([
    supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("organization_id", org.id),
    can.viewBank(roles) ? supabase.from("bank_accounts").select("id").eq("organization_id", org.id) : Promise.resolve({ data: null }),
  ]);
  const { data: roleRows } = await supabase.from("memberships").select("role").eq("organization_id", org.id).eq("status", "active");
  const have = new Set((roleRows ?? []).map((r) => r.role));
  const steps = [
    { done: true, t: "Daftar masjid", d: "Akaun masjid telah dicipta", href: "" },
    { done: !!(org.address && org.postcode && org.phone), t: "Lengkapkan profil masjid", d: "Alamat, poskod, telefon dan daerah untuk borang rasmi", href: "profil" },
    { done: bank ? bank.length > 0 : null, t: "Tambah akaun bank", d: "Akaun semasa masjid (SOP 8.2.1)", href: "profil#bank" },
    { done: have.has("chairman") && have.has("treasurer"), t: "Jemput Nazir dan Bendahari", d: "Penyedia dan pelulus baucer mesti orang berbeza", href: "pengguna" },
    { done: have.has("auditor"), t: "Jemput Pemeriksa Kira-kira", d: "Untuk menyemak penyata 6 bulanan", href: "pengguna" },
  ];
  const doneN = steps.filter((s) => s.done).length;
  return (
    <>
      <Flash {...m} />
      <section className="hero">
        <div>
          <p className="text-xs font-extrabold tracking-[3px] mb-2" style={{ color: "var(--pri)" }}>{org.name.toUpperCase()}</p>
          <h1 className="page" style={{ fontSize: "clamp(32px,4.4vw,50px)" }}>Assalamualaikum, <em>{(profile?.full_name || "").split(" bin ")[0] || "tuan/puan"}</em></h1>
          <p className="sub">Anda log masuk sebagai {roles.map((r) => ROLE_LABEL[r]).join(", ")}. {doneN < steps.length ? `${steps.length - doneN} langkah lagi untuk menyiapkan akaun masjid.` : "Akaun masjid sudah lengkap."}</p>
        </div>
        <div className="card text-center">
          <div className="serif" style={{ fontSize: 56, color: "var(--pri)", lineHeight: 1 }}>{doneN}/{steps.length}</div>
          <div className="text-sm mt-1" style={{ color: "var(--mute)" }}>langkah persediaan selesai · {members ?? 0} peranan aktif</div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="card-title">Persediaan akaun</h2>
          <div className="grid gap-2.5">
            {steps.map((s, i) => (
              <Link key={i} href={`/o/${slug}${s.href ? "/" + s.href : ""}`} className="check">
                <span className={`dot ${s.done ? "done" : ""}`}>{s.done ? "✓" : ""}</span>
                <span><b className="block text-[14.5px]">{s.t}</b><small style={{ color: "var(--mute)" }}>{s.done === null ? "Hanya Pentadbir/Bendahari boleh melihat" : s.d}</small></span>
              </Link>
            ))}
          </div>
        </section>
        <section className="card">
          <h2 className="card-title">Modul seterusnya</h2>
          <p className="text-sm" style={{ color: "var(--mute)" }}>Modul kewangan (kutipan Jumaat, resit, baucer, buku tunai, penyata bank AI dan laporan JAIS) sedang dipindahkan daripada prototaip ke sistem ini dalam langkah seterusnya Fasa 1.</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {["Kutipan Jumaat (BR-KMS 003)", "Resit rasmi (BR-KMS 005)", "Baucar bayaran (BR-KMS 007)", "Buku Tunai (BR-KMS 002)", "Penyata bank dengan AI", "Laporan BR-KMS 018, 019, 020"].map((x) => <li key={x}><span className="badge badge-n">Akan datang</span> {x}</li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
