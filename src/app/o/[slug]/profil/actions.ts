"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/org";

const back = (slug: string, k: "ok" | "err", m: string, hash = "") => redirect(`/o/${slug}/profil?${k}=${encodeURIComponent(m)}${hash}`);
const opt = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));

const OrgSchema = z.object({
  name: z.string().trim().min(3, "Nama terlalu pendek").max(150),
  org_type: z.enum(["masjid", "masjid_diwartakan", "surau", "surau_jumaat", "musolla"]),
  district: opt(80), address: opt(300),
  postcode: z.string().trim().refine((v) => v === "" || /^[0-9]{5}$/.test(v), "Poskod mesti 5 digit").transform((v) => v || null),
  phone: opt(30),
  email: z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, "Emel tidak sah").transform((v) => v || null),
  registration_no: opt(60),
  receipt_prefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,4}$/, "Awalan resit 1–4 huruf/nombor"),
  fiscal_year_start: z.coerce.number().int().min(1).max(12),
});

export async function updateOrg(slug: string, orgId: string, fd: FormData) {
  const p = OrgSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) back(slug, "err", p.error!.issues[0]?.message ?? "Maklumat tidak sah");
  const supabase = await createClient();
  const { data, error } = await supabase.from("organizations").update(p.data!).eq("id", orgId).select("id");
  if (error) back(slug, "err", friendlyError(error));
  if (!data?.length) back(slug, "err", "Anda tiada kebenaran untuk mengubah profil masjid.");
  revalidatePath(`/o/${slug}`, "layout");
  back(slug, "ok", "Profil masjid disimpan. Perubahan direkod dalam log audit.");
}

const BankSchema = z.object({
  bank_name: z.string().trim().min(2).max(80),
  account_name: z.string().trim().min(3).max(150),
  account_no: z.string().trim().regex(/^[0-9 -]{6,30}$/, "Nombor akaun hanya nombor, ruang atau sengkang"),
  mais_approval_ref: opt(80),
});

export async function addBank(slug: string, orgId: string, fd: FormData) {
  const p = BankSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) back(slug, "err", p.error!.issues[0]?.message ?? "Maklumat tidak sah", "#bank");
  const supabase = await createClient();
  const { count } = await supabase.from("bank_accounts").select("id", { count: "exact", head: true }).eq("organization_id", orgId);
  const first = (count ?? 0) === 0;
  if (!first && !p.data!.mais_approval_ref) back(slug, "err", "Akaun tambahan memerlukan rujukan kebenaran MAIS (SOP 8.2.1).", "#bank");
  const { error } = await supabase.from("bank_accounts").insert({ ...p.data!, organization_id: orgId, is_primary: first });
  if (error) back(slug, "err", friendlyError(error), "#bank");
  revalidatePath(`/o/${slug}`, "layout");
  back(slug, "ok", "Akaun bank ditambah.", "#bank");
}

export async function deleteBank(slug: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bank_accounts").delete().eq("id", id).select("id");
  if (error || !data?.length) back(slug, "err", error ? friendlyError(error) : "Anda tiada kebenaran.", "#bank");
  revalidatePath(`/o/${slug}`, "layout");
  back(slug, "ok", "Akaun bank dibuang.", "#bank");
}
