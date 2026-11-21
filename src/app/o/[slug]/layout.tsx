import Link from "next/link";
import { getOrgContext, myOrgs } from "@/lib/org";
import { can } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { OrgNav } from "@/components/OrgNav";
import { signOut } from "@/app/actions";

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org, roles, profile, user } = await getOrgContext(slug);
  const orgs = await myOrgs();
  const items = [
    { href: "", label: "Utama" },
    { href: "profil", label: "Profil Masjid" },
    { href: "pengguna", label: "Pengguna" },
    ...(can.viewAudit(roles) ? [{ href: "audit", label: "Log Audit" }] : []),
  ];
  return (
    <>
      <header className="topbar">
        <Link href={`/o/${slug}`} className="flex items-center gap-2.5 no-underline" style={{ color: "var(--ink)" }}>
          <Logo />
          <span className="leading-tight"><b className="block">{org.name}</b><small style={{ color: "var(--mute)" }}>IMARIX</small></span>
        </Link>
        <OrgNav slug={slug} items={items} />
        <details className="relative">
          <summary className="btn btn-sm cursor-pointer" aria-label="Menu akaun">{(profile?.full_name || user.email || "?").split(" ")[0]} ▾</summary>
          <div className="menu">
            <div className="px-3 py-2 text-xs" style={{ color: "var(--mute)" }}>{user.email}</div>
            <Link href="/akaun">Akaun saya</Link>
            {orgs.filter((o) => o.slug !== slug).map((o) => <Link key={o.id} href={`/o/${o.slug}`}>Tukar ke {o.name}</Link>)}
            <Link href="/onboarding">+ Daftar masjid lain</Link>
            <form action={signOut}><button type="submit">Log keluar</button></form>
          </div>
        </details>
      </header>
      <main className="main">{children}</main>
    </>
  );
}
