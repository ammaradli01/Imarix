import Link from "next/link";
import type { Metadata } from "next";
import { signIn } from "@/app/actions";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/marketing/AuthShell";
import { msg } from "@/lib/org";

export const metadata: Metadata = { title: "Log masuk — IMARIX" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams; const m = msg(sp); const next = sp.next ?? "/app";
  return (
    <AuthShell mode="login">
      <h1 className="page">Assalamualaikum</h1>
      <p className="sub">Log masuk ke akaun masjid atau surau anda.</p>
      <Flash {...m} />
      <form action={signIn} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="field">Emel<input className="input" type="email" name="email" autoComplete="email" required /></label>
        <label className="field">Kata laluan<input className="input" type="password" name="password" autoComplete="current-password" required />
          <small><Link href="/lupa-kata-laluan" style={{ color: "var(--pri)", fontWeight: 700 }}>Lupa kata laluan?</Link></small></label>
        <SubmitButton pendingText="Log masuk…">Log masuk</SubmitButton>
      </form>
      <p className="text-sm mt-5" style={{ color: "var(--mute)" }}>Belum ada akaun? <Link className="font-bold" style={{ color: "var(--pri)" }} href={`/daftar?next=${encodeURIComponent(next)}`}>Daftar percuma</Link></p>
    </AuthShell>
  );
}
