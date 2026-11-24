import Link from "next/link";
import type { Metadata } from "next";
import { signUp } from "@/app/actions";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/marketing/AuthShell";
import { msg } from "@/lib/org";
import { TRIAL_DAYS } from "@/lib/pricing";

export const metadata: Metadata = { title: "Daftar percuma — IMARIX" };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams; const m = msg(sp); const next = sp.next ?? "/onboarding";
  return (
    <AuthShell mode="daftar">
      <span className="badge">Percuma {TRIAL_DAYS} hari</span>
      <h1 className="page" style={{ marginTop: 10 }}>Daftar akaun</h1>
      <p className="sub">Untuk Nazir, Bendahari, Setiausaha atau AJK. Selepas mendaftar, daftarkan masjid anda atau terima jemputan.</p>
      <Flash {...m} />
      <form action={signUp} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="field">Nama penuh<input className="input" name="full_name" autoComplete="name" required minLength={3} maxLength={120} /></label>
        <label className="field">Emel<input className="input" type="email" name="email" autoComplete="email" required /></label>
        <label className="field">Kata laluan<input className="input" type="password" name="password" autoComplete="new-password" required minLength={10} /><small>Sekurang-kurangnya 10 aksara</small></label>
        <p className="text-xs" style={{ color: "var(--mute)" }}>Dengan mendaftar, anda bersetuju dengan <Link href="/terma" style={{ color: "var(--pri)" }}>Terma Perkhidmatan</Link> dan data anda diproses mengikut <Link href="/privasi" style={{ color: "var(--pri)" }}>Notis Privasi</Link> (PDPA 2010).</p>
        <SubmitButton pendingText="Mendaftar…">Daftar dan mula percubaan</SubmitButton>
      </form>
      <p className="text-sm mt-5" style={{ color: "var(--mute)" }}>Sudah ada akaun? <Link className="font-bold" style={{ color: "var(--pri)" }} href={`/login?next=${encodeURIComponent(next)}`}>Log masuk</Link></p>
    </AuthShell>
  );
}
