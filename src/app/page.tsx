import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: orgs } = await supabase.from("organizations").select("slug").order("created_at").limit(1);
  redirect(orgs && orgs.length ? `/o/${orgs[0].slug}` : "/onboarding");
}
