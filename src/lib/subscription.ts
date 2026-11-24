import type { SupabaseClient } from "@supabase/supabase-js";

export type SubState = "percubaan" | "aktif" | "tamat" | "dibatalkan";
export type Sub = { status: SubState; billing_cycle: "bulanan" | "tahunan" | null; trial_ends_at: string; current_period_end: string | null };

/** Sama seperti app.subscription_state() di pangkalan data. */
export function effectiveState(s: Sub | null): { state: SubState; until: Date | null; daysLeft: number } {
  if (!s) return { state: "tamat", until: null, daysLeft: 0 };
  const now = Date.now();
  const end = s.current_period_end ? new Date(s.current_period_end) : null;
  const trial = new Date(s.trial_ends_at);
  let state: SubState; let until: Date | null;
  if (s.status === "dibatalkan") { state = "dibatalkan"; until = end; }
  else if (end && end.getTime() > now) { state = "aktif"; until = end; }
  else if (!end && trial.getTime() > now) { state = "percubaan"; until = trial; }
  else { state = "tamat"; until = end ?? trial; }
  const daysLeft = until ? Math.max(0, Math.ceil((until.getTime() - now) / 86_400_000)) : 0;
  return { state, until, daysLeft };
}

export async function getSubscription(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase.from("subscriptions")
    .select("status, billing_cycle, trial_ends_at, current_period_end").eq("organization_id", orgId).maybeSingle();
  return effectiveState((data as Sub) ?? null);
}

export const tarikh = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }) : "—";
