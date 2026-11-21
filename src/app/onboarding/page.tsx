import Link from "next/link";
import { createOrganization } from "./actions";
import { Logo } from "@/components/Logo";
import { Flash } from "@/components/Flash";
import { NameSlugFields } from "@/components/SlugInput";
import { SubmitButton } from "@/components/SubmitButton";
import { msg, myOrgs } from "@/lib/org";
import { ORG_TYPE_LABEL } from "@/lib/roles";

export default async function Onboarding({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const m = msg(await searchParams);
  const orgs = await myOrgs();
  return (
    <main className="auth-wrap">
      <div className="card" style={{ width: "min(640px,100%)" }}>
        <div className="flex items-center gap-3 mb-6"><Logo /><b className="text-lg">IMARIX</b></div>
        <p className="text-xs font-extrabold tracking-[3px]" style={{ color: "var(--pri)" }}>LANGKAH 1 DARIPADA 5</p>
        <h1 className="page">Daftar masjid anda</h1>
        <p className="sub">Anda akan menjadi pentadbir akaun ini. Maklumat lain boleh dilengkapkan kemudian dalam Profil Masjid.</p>
        <Flash {...m} />
        <form action={createOrganization} className="grid gap-4">
          <NameSlugFields />
          <div className="form-grid">
            <label className="field">Jenis
              <select className="input" name="org_type" defaultValue="masjid">
                {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="field">Daerah<input className="input" name="district" placeholder="cth. Hulu Langat" maxLength={80} /></label>
          </div>
          <label className="field">Jawatan anda di masjid
            <select className="input" name="my_role" defaultValue="treasurer">
              <option value="chairman">Nazir / Pengerusi</option>
              <option value="treasurer">Bendahari</option>
              <option value="secretary">Setiausaha</option>
              <option value="committee">AJK</option>
            </select>
          </label>
          <SubmitButton pendingText="Mendaftar…">Daftar masjid</SubmitButton>
        </form>
        {orgs.length > 0 && (
          <p className="text-sm mt-5" style={{ color: "var(--mute)" }}>Atau buka masjid sedia ada: {orgs.map((o) => <Link key={o.id} className="font-bold mr-3" style={{ color: "var(--pri)" }} href={`/o/${o.slug}`}>{o.name}</Link>)}</p>
        )}
      </div>
    </main>
  );
}
