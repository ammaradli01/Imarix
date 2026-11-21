"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/org";

const Schema = z.object({
  name: z.string().trim().min(3).max(150),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, "Alamat ringkas tidak sah"),
  org_type: z.enum(["masjid", "masjid_diwartakan", "surau", "surau_jumaat", "musolla"]),
  district: z.string().trim().max(80),
  my_role: z.enum(["chairman", "treasurer", "secretary", "committee"]),
});

export async function createOrganization(fd: FormData) {
  const p = Schema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect(`/onboarding?err=${encodeURIComponent(p.error.issues[0]?.message ?? "Maklumat tidak sah")}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", {
    p_name: p.data.name, p_slug: p.data.slug, p_org_type: p.data.org_type, p_district: p.data.district, p_my_role: p.data.my_role,
  });
  if (error) {
    const m = error.code === "23505" ? "Alamat ringkas ini sudah digunakan. Sila pilih yang lain." : friendlyError(error);
    redirect(`/onboarding?err=${encodeURIComponent(m)}`);
  }
  redirect(`/o/${p.data.slug}?ok=${encodeURIComponent("Masjid didaftarkan. Lengkapkan langkah di bawah untuk bermula.")}`);
}
