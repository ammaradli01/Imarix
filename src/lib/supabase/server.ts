import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Klien Supabase untuk Server Components, Server Actions dan Route Handlers.
 *  Menggunakan sesi pengguna: semua pertanyaan tertakluk kepada Row Level Security. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* Dipanggil dari Server Component: middleware akan menyegarkan sesi. */
          }
        },
      },
    },
  );
}
