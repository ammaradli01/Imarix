"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/org";
import { ROLES } from "@/lib/roles";

const back = (slug: string, k: "ok" | "err", m: string, extra = "") => redirect(`/o/${slug}/pengguna?${k}=${encodeURIComponent(m)}${extra}`);

export async function invite(slug: string, orgId: string, fd: FormData) {
  const p = z.object({ email: z.string().trim().toLowerCase().email("Emel tidak sah"), role: z.enum(ROLES) }).safeParse(Object.fromEntries(fd));
  if (!p.success) back(slug, "err", p.error!.issues[0]?.message ?? "Maklumat tidak sah");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("invitations")
    .insert({ organization_id: orgId, email: p.data!.email, role: p.data!.role, invited_by: user!.id }).select("token").single();
  if (error) back(slug, "err", error.code === "23505" ? "Jemputan untuk emel dan peranan ini masih aktif." : friendlyError(error));
  revalidatePath(`/o/${slug}/pengguna`);
  back(slug, "ok", "Jemputan dicipta. Salin pautan dan hantar kepada penerima melalui WhatsApp atau emel.", `&baru=${data!.token}`);
}

export async function revokeInvite(slug: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("invitations").update({ revoked_at: new Date().toISOString() }).eq("id", id).select("id");
  if (error || !data?.length) back(slug, "err", error ? friendlyError(error) : "Anda tiada kebenaran.");
  revalidatePath(`/o/${slug}/pengguna`);
  back(slug, "ok", "Jemputan dibatalkan.");
}

export async function addRole(slug: string, orgId: string, userId: string, fd: FormData) {
  const p = z.enum(ROLES).safeParse(fd.get("role"));
  if (!p.success) back(slug, "err", "Peranan tidak sah");
  const supabase = await createClient();
  const { error } = await supabase.from("memberships").insert({ organization_id: orgId, user_id: userId, role: p.data! });
  if (error) back(slug, "err", error.code === "23505" ? "Pengguna sudah mempunyai peranan ini." : error.code === "42501" ? "Anda tidak boleh memberi peranan ini (atau mengubah peranan sendiri)." : friendlyError(error));
  revalidatePath(`/o/${slug}`, "layout");
  back(slug, "ok", "Peranan ditambah.");
}

export async function removeRole(slug: string, membershipId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("memberships").delete().eq("id", membershipId).select("id");
  if (error) back(slug, "err", error.message.includes("sekurang-kurangnya") ? "Organisasi mesti mempunyai sekurang-kurangnya seorang Pentadbir." : friendlyError(error));
  if (!data?.length) back(slug, "err", "Anda tidak boleh membuang peranan ini (termasuk peranan sendiri).");
  revalidatePath(`/o/${slug}`, "layout");
  back(slug, "ok", "Peranan dibuang.");
}
