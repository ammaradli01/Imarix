"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/org";

const back = (k: "ok" | "err", m: string) => redirect(`/pentadbir?${k}=${encodeURIComponent(m)}`);

export async function markPaid(fd: FormData) {
  const p = z.object({ id: z.string().uuid(), ref: z.string().trim().min(3, "Masukkan rujukan bayaran (contoh: no. rujukan bank)").max(80) })
    .safeParse({ id: fd.get("id"), ref: fd.get("ref") });
  if (!p.success) back("err", p.error.issues[0].message);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mark_invoice_paid", { p_invoice: p.data!.id, p_ref: p.data!.ref });
  if (error) back("err", error.code === "23505" ? "Rujukan bayaran ini sudah digunakan untuk invois lain." : friendlyError(error));
  revalidatePath("/pentadbir");
  back("ok", "Invois ditandakan dibayar dan langganan diaktifkan.");
}

export async function cancelInvoice(fd: FormData) {
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) back("err", "Invois tidak sah");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_invoice", { p_invoice: id.data! });
  if (error) back("err", friendlyError(error));
  revalidatePath("/pentadbir");
  back("ok", "Invois dibatalkan.");
}
