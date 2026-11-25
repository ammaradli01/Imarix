"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/org";

/** Minta invois. Harga ditetapkan oleh pangkalan data, bukan borang ini. */
export async function requestInvoice(slug: string, orgId: string, fd: FormData) {
  const cycle = z.enum(["bulanan", "tahunan"]).safeParse(fd.get("cycle"));
  const back = (k: "ok" | "err", m: string) => redirect(`/o/${slug}/langganan?${k}=${encodeURIComponent(m)}#invois`);
  if (!cycle.success) back("err", "Sila pilih bulanan atau tahunan.");
  const supabase = await createClient();
  const { data: invId, error } = await supabase.rpc("request_subscription_invoice", { p_org: orgId, p_cycle: cycle.data! });
  if (error) back("err", friendlyError(error));
  revalidatePath(`/o/${slug}/langganan`);
  redirect(`/o/${slug}/langganan/invois/${invId}`);
}
