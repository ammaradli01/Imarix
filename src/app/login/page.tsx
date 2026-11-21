import Link from "next/link";
import { signIn } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { msg } from "@/lib/org";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams; const m = msg(sp); const next = sp.next ?? "/";
  return (
    <main className="auth-wrap">
      <div className="auth-card card">
        <div className="flex items-center gap-3 mb-6"><Logo /><div><b className="text-lg">MASJID360</b><div className="text-sm" style={{ color: "var(--mute)" }}>Pengurusan Kewangan Masjid</div></div></div>
        <h1 className="page">Assalamualaikum</h1>
        <p className="sub">Log masuk ke akaun masjid atau surau anda.</p>
        <Flash {...m} />
        <form action={signIn} className="grid gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="field">Emel<input className="input" type="email" name="email" autoComplete="email" required /></label>
          <label className="field">Kata laluan<input className="input" type="password" name="password" autoComplete="current-password" required /></label>
          <SubmitButton pendingText="Log masuk…">Log masuk</SubmitButton>
        </form>
        <p className="text-sm mt-5" style={{ color: "var(--mute)" }}>Belum ada akaun? <Link className="font-bold" style={{ color: "var(--pri)" }} href={`/daftar?next=${encodeURIComponent(next)}`}>Daftar sekarang</Link></p>
      </div>
    </main>
  );
}
