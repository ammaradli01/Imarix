import Link from "next/link";
import { signUp } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { msg } from "@/lib/org";

export default async function DaftarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams; const m = msg(sp); const next = sp.next ?? "/onboarding";
  return (
    <main className="auth-wrap">
      <div className="auth-card card">
        <div className="flex items-center gap-3 mb-6"><Logo /><b className="text-lg">IMARIX</b></div>
        <h1 className="page">Daftar akaun</h1>
        <p className="sub">Untuk Nazir, Bendahari, Setiausaha atau AJK. Selepas mendaftar, anda boleh mendaftarkan masjid atau menerima jemputan.</p>
        <Flash {...m} />
        <form action={signUp} className="grid gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="field">Nama penuh<input className="input" name="full_name" autoComplete="name" required minLength={3} maxLength={120} /></label>
          <label className="field">Emel<input className="input" type="email" name="email" autoComplete="email" required /></label>
          <label className="field">Kata laluan<input className="input" type="password" name="password" autoComplete="new-password" required minLength={10} /><small>Sekurang-kurangnya 10 aksara</small></label>
          <p className="text-xs" style={{ color: "var(--mute)" }}>Dengan mendaftar, anda bersetuju data anda diproses untuk pengurusan masjid mengikut Notis Privasi (PDPA 2010).</p>
          <SubmitButton pendingText="Mendaftar…">Daftar</SubmitButton>
        </form>
        <p className="text-sm mt-5" style={{ color: "var(--mute)" }}>Sudah ada akaun? <Link className="font-bold" style={{ color: "var(--pri)" }} href={`/login?next=${encodeURIComponent(next)}`}>Log masuk</Link></p>
      </div>
    </main>
  );
}
