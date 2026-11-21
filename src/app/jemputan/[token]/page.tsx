import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { friendlyError, msg } from "@/lib/org";

async function accept(fd: FormData) {
  "use server";
  const token = String(fd.get("token"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) redirect(`/jemputan/${token}?err=${encodeURIComponent(friendlyError(error))}`);
  redirect(`/?ok=${encodeURIComponent("Selamat datang!")}`);
}

export default async function Jemputan({ params, searchParams }:
  { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params; const m = msg(await searchParams);
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.rpc("invitation_preview", { p_token: token });
  const inv = Array.isArray(data) ? data[0] : null;
  return (
    <main className="auth-wrap">
      <div className="auth-card card">
        <div className="flex items-center gap-3 mb-6"><Logo /><b className="text-lg">MASJID360</b></div>
        {!inv ? <><h1 className="page">Jemputan tidak sah</h1><p className="sub">Pautan ini tidak wujud. Minta pentadbir masjid menghantar jemputan baharu.</p></> : (
          <>
            <h1 className="page">Anda dijemput</h1>
            <p className="sub">ke <b>{inv.organization_name}</b> sebagai <b>{ROLE_LABEL[inv.role as Role]}</b>.</p>
            <Flash {...m} />
            {inv.used ? <div className="alert alert-err">Jemputan ini telah digunakan atau dibatalkan.</div>
              : inv.expired ? <div className="alert alert-err">Jemputan ini telah tamat tempoh. Minta jemputan baharu.</div>
              : user?.email?.toLowerCase() !== String(inv.email).toLowerCase() ? (
                <div className="alert alert-err">Jemputan ini untuk <b>{inv.email}</b>. Anda log masuk sebagai {user?.email}. Log keluar dan log masuk dengan emel yang betul.</div>
              ) : (
                <form action={accept}><input type="hidden" name="token" value={token} /><SubmitButton pendingText="Menerima…">Terima jemputan</SubmitButton></form>
              )}
          </>
        )}
        <p className="text-sm mt-5"><Link href="/" style={{ color: "var(--pri)" }} className="font-bold">Kembali</Link></p>
      </div>
    </main>
  );
}
