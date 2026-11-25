import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/org";
import { can, type Role } from "@/lib/roles";
import { buildInvoicePdf } from "@/lib/invoicePdf";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) return NextResponse.redirect(new URL(`/login?next=/o/${slug}/langganan`, req.url));

  const { data: org } = await supabase.from("organizations").select("id, name, address, postcode, district, phone, email").eq("slug", slug).maybeSingle();
  if (!org) return new NextResponse("Tidak dijumpai", { status: 404 });
  const { data: rows } = await supabase.from("memberships").select("role").eq("organization_id", org.id).eq("user_id", user.id).eq("status", "active");
  if (!can.manageBilling((rows ?? []).map((r) => r.role as Role))) return new NextResponse("Tidak dijumpai", { status: 404 });
  const { data: inv } = await supabase.from("subscription_invoices")
    .select("invoice_no, billing_cycle, amount_sen, status, created_at, paid_at, gateway_ref").eq("id", id).eq("organization_id", org.id).maybeSingle();
  if (!inv) return new NextResponse("Tidak dijumpai", { status: 404 });

  const bytes = await buildInvoicePdf(org, inv);
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${inv.invoice_no}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
