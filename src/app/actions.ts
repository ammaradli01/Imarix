"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const safeNext = (n: FormDataEntryValue | null) => {
  const s = typeof n === "string" ? n : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/app";
};

export async function signIn(fd: FormData) {
  const next = safeNext(fd.get("next"));
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) redirect(`/login?err=${encodeURIComponent("Sila isi emel dan kata laluan yang sah.")}&next=${encodeURIComponent(next)}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?err=${encodeURIComponent(error.message === "Email not confirmed" ? "Sila sahkan emel anda dahulu melalui pautan yang dihantar." : "Emel atau kata laluan tidak tepat.")}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUp(fd: FormData) {
  const next = safeNext(fd.get("next"));
  const parsed = z.object({
    full_name: z.string().trim().min(3).max(120),
    email: z.string().email(),
    password: z.string().min(10, "Kata laluan sekurang-kurangnya 10 aksara"),
  }).safeParse({ full_name: fd.get("full_name"), email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) redirect(`/daftar?err=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Maklumat tidak sah")}&next=${encodeURIComponent(next)}`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email, password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name }, emailRedirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) redirect(`/daftar?err=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  if (!data.session) redirect(`/login?ok=${encodeURIComponent("Akaun dicipta. Sila semak emel anda untuk mengesahkan akaun, kemudian log masuk.")}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
