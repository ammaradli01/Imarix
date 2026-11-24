import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { msg, friendlyError } from "@/lib/org";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { Logo } from "@/components/Logo";

async function save(fd: FormData) {
  "use server";
  const p = z.object({ full_name: z.string().trim().min(3).max(120), phone: z.string().trim().max(30) }).safeParse(Object.fromEntries(fd));
  if (!p.success) redirect(`/akaun?err=${encodeURIComponent("Nama sekurang-kurangnya 3 aksara.")}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("profiles").update({ full_name: p.data.full_name, phone: p.data.phone || null }).eq("id", user!.id);
  if (error) redirect(`/akaun?err=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/", "layout");
  redirect(`/akaun?ok=${encodeURIComponent("Maklumat akaun disimpan.")}`);
}

export default async function Akaun({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const m = msg(await searchParams);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("full_name, phone").eq("id", user!.id).maybeSingle();
  return (
    <main className="auth-wrap">
      <div className="auth-card card">
        <div className="flex items-center gap-3 mb-6"><Logo /><b className="text-lg">IMARIX</b></div>
        <h1 className="page">Akaun saya</h1>
        <p className="sub">{user!.email}</p>
        <Flash {...m} />
        <form action={save} className="grid gap-4">
          <label className="field">Nama penuh<input className="input" name="full_name" defaultValue={p?.full_name ?? ""} required minLength={3} maxLength={120} /><small>Nama ini dipaparkan pada borang yang anda sediakan atau luluskan</small></label>
          <label className="field">No. telefon<input className="input" name="phone" type="tel" defaultValue={p?.phone ?? ""} /></label>
          <SubmitButton>Simpan</SubmitButton>
        </form>
        <p className="text-sm mt-5"><Link href="/app" className="font-bold" style={{ color: "var(--pri)" }}>← Kembali</Link></p>
      </div>
    </main>
  );
}
