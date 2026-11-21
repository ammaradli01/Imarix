import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/roles";

export type Org = {
  id: string; slug: string; name: string; org_type: string; state_code: string;
  district: string | null; address: string | null; postcode: string | null; phone: string | null;
  email: string | null; registration_no: string | null; fiscal_year_start: number; receipt_prefix: string;
  created_at: string; updated_at: string;
};

/** Muat organisasi melalui slug dan peranan pengguna semasa.
 *  RLS memastikan organisasi hanya kelihatan kepada ahlinya; selain itu 404. */
export async function getOrgContext(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/o/${slug}`);

  const { data: org } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle<Org>();
  if (!org) notFound();

  const { data: rows } = await supabase.from("memberships").select("role")
    .eq("organization_id", org.id).eq("user_id", user.id).eq("status", "active");
  const roles = (rows ?? []).map((r) => r.role as Role);
  if (roles.length === 0) notFound();

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
  return { supabase, user, org, roles, profile };
}

/** Senarai organisasi yang pengguna sertai (untuk penukar organisasi). */
export async function myOrgs() {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("id, slug, name, org_type").order("name");
  return data ?? [];
}

export function msg(sp: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return { ok: one(sp.ok), err: one(sp.err) };
}

/** Terjemah ralat pangkalan data kepada mesej mesra pengguna. */
export function friendlyError(e: { message?: string; code?: string } | null | undefined) {
  if (!e) return "Ralat tidak diketahui";
  if (e.code === "23505") return "Rekod ini sudah wujud.";
  if (e.code === "42501") return "Anda tiada kebenaran untuk tindakan ini.";
  if (e.code === "23514") return "Sila semak format maklumat yang dimasukkan.";
  return e.message || "Ralat tidak diketahui";
}
