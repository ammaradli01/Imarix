import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { setNewPassword } from "@/app/actions";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/marketing/AuthShell";
import { createClient } from "@/lib/supabase/server";
import { currentUser, msg } from "@/lib/org";

export const metadata: Metadata = { title: "Kata laluan baharu — IMARIX" };

export default async function KataLaluanBaru({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const m = msg(await searchParams);
  const user = await currentUser(await createClient());
  if (!user) redirect(`/lupa-kata-laluan?err=${encodeURIComponent("Pautan telah tamat. Sila minta pautan baharu.")}`);
  return (
    <AuthShell mode="login">
      <h1 className="page">Kata laluan baharu</h1>
      <p className="sub">Untuk {user.email}</p>
      <Flash {...m} />
      <form action={setNewPassword} className="grid gap-4">
        <label className="field">Kata laluan baharu<input className="input" type="password" name="password" autoComplete="new-password" required minLength={10} /><small>Sekurang-kurangnya 10 aksara</small></label>
        <label className="field">Ulang kata laluan<input className="input" type="password" name="confirm" autoComplete="new-password" required minLength={10} /></label>
        <SubmitButton pendingText="Menyimpan…">Simpan kata laluan</SubmitButton>
      </form>
    </AuthShell>
  );
}
