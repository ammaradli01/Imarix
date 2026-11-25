import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/daftar", "/auth", "/lupa-kata-laluan", "/harga", "/privasi", "/terma", "/landing", "/brand"];
/** Laman utama awam: padanan tepat sahaja, supaya "/" tidak membuka semua laluan. */
const PUBLIC_EXACT = ["/"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_EXACT.includes(path) || PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Tetapan hilang: jangan jatuhkan seluruh laman. Laman awam masih dipaparkan; halaman akaun disekat.
    console.error("IMARIX: NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditetapkan");
    return isPublic ? response : new NextResponse("Sistem sedang diselenggara. Sila cuba sebentar lagi.", { status: 503 });
  }
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  let user = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (e) {
    console.error("IMARIX: gagal menyemak sesi", e);
  }

  if (!user && !isPublic) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    to.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(to);
  }
  return response;
}
