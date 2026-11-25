import Link from "next/link";
import type { Metadata } from "next";
import { requestPasswordReset } from "@/app/actions";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/marketing/AuthShell";
import { msg } from "@/lib/org";

export const metadata: Metadata = { title: "Lupa kata laluan — IMARIX" };

export default async function Lupa({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const m = msg(await searchParams);
  return (
    <AuthShell mode="login">
      <h1 className="page">Lupa kata laluan</h1>
      <p className="sub">Masukkan emel akaun anda. Kami hantar pautan untuk menetapkan kata laluan baharu.</p>
      <Flash {...m} />
      <form action={requestPasswordReset} className="grid gap-4">
        <label className="field">Emel<input className="input" type="email" name="email" autoComplete="email" required /></label>
        <SubmitButton pendingText="Menghantar…">Hantar pautan</SubmitButton>
      </form>
      <p className="text-sm mt-5" style={{ color: "var(--mute)" }}><Link className="font-bold" style={{ color: "var(--pri)" }} href="/login">← Kembali ke log masuk</Link></p>
    </AuthShell>
  );
}
