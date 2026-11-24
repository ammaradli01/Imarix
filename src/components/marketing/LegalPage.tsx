import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mk">
      <SiteHeader />
      <article className="mk-wrap mk-legal">
        <h1 className="mk-h1">{title}</h1>
        <p className="mk-draft">Draf. Dokumen ini belum disemak oleh peguam dan akan dikemas kini sebelum pelancaran rasmi.</p>
        {children}
      </article>
      <SiteFooter />
    </div>
  );
}
