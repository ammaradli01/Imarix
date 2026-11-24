import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/** Bar navigasi laman awam. Pengguna yang sudah log masuk nampak butang ke papan pemuka. */
export async function SiteHeader() {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    loggedIn = !!user;
  } catch { loggedIn = false; }
  const links = [["/#ciri", "Ciri"], ["/#cara-mula", "Cara mula"], ["/harga", "Harga"], ["/#soalan", "Soalan lazim"]];
  return (
    <header className="mk-nav">
      <div className="mk-wrap mk-nav-in">
        <Link href="/" className="mk-brand" aria-label="IMARIX, laman utama">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/imarix-icon.png" alt="" width={30} height={37} />
          <span><b>IMARIX</b><small>Pengurusan Kewangan Masjid</small></span>
        </Link>
        <nav className="mk-links" aria-label="Navigasi laman">
          {links.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
        </nav>
        <div className="mk-cta">
          {loggedIn ? (
            <Link className="btn btn-pri btn-sm" href="/app">Papan pemuka</Link>
          ) : (
            <>
              <Link className="btn btn-sm mk-login" href="/login">Log masuk</Link>
              <Link className="btn btn-pri btn-sm" href="/daftar">Cuba percuma</Link>
            </>
          )}
          <details className="mk-burger">
            <summary aria-label="Menu">☰</summary>
            <div>
              {links.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
              {!loggedIn && <Link href="/login">Log masuk</Link>}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
