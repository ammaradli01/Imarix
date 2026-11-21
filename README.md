# IMARIX

Pengurusan kewangan masjid dan surau mengikut Garis Panduan Pengurusan Kewangan MAIS. Oleh **Fathi Global**.

Fasa 1, langkah 1 (asas): log masuk, akaun berasingan untuk setiap masjid (multi-tenant), peranan, jemputan pengguna, profil masjid boleh diedit, akaun bank dan log audit.

**Teknologi:** Next.js 15 (App Router) · Supabase (PostgreSQL, Auth, Row Level Security) · Tailwind CSS 4 · Zod

## Mula

### 1. Cipta projek Supabase
1. Daftar di [supabase.com](https://supabase.com) dan cipta projek baharu. Pilih rantau **Southeast Asia (Singapore)**.
2. Buka **SQL Editor**, salin seluruh kandungan `supabase/migrations/20261121000001_foundation.sql`, dan jalankan.
   (Atau dengan Supabase CLI: `supabase link --project-ref <ref>` kemudian `supabase db push`.)
3. **Authentication → URL Configuration:**
   - Site URL: URL aplikasi anda (cth. `https://app.imarix.my`, atau `http://localhost:3000` semasa pembangunan)
   - Redirect URLs: tambah `<Site URL>/auth/callback`
4. **Authentication → Providers → Email:** biarkan "Confirm email" aktif.

### 2. Jalankan aplikasi
```bash
npm install
cp .env.example .env.local   # isi URL dan anon key daripada Supabase > Project Settings > API
npm run dev                  # http://localhost:3000
```

### 3. Cuba aliran utama
1. `/daftar` → cipta akaun → sahkan emel → log masuk.
2. `/onboarding` → daftar masjid (anda menjadi Pentadbir + jawatan yang dipilih).
3. **Profil Masjid** → lengkapkan alamat, poskod, telefon dan tambah akaun bank.
4. **Pengguna** → cipta jemputan untuk Nazir/Bendahari/Pemeriksa → salin pautan → hantar melalui WhatsApp.
5. **Log Audit** → lihat siapa mengubah apa.

## Ujian

Ujian pangkalan data (33 ujian: pengasingan tenant, peranan, jemputan, log audit) dijalankan pada PostgreSQL 16 tempatan:
```bash
npm run test:db          # perlukan PostgreSQL 16 (initdb, pg_ctl, psql); jangan jalankan sebagai root
```
Fail `supabase/tests/00_auth_stub.sql` meniru skema `auth` Supabase untuk ujian sahaja. Ia **tidak** dijalankan di Supabase.

## Struktur
```
supabase/migrations/     Skema, fungsi, polisi RLS (sumber kebenaran untuk kebenaran)
supabase/tests/          Ujian RLS dan penjalan ujian
src/lib/supabase/        Klien Supabase (server, middleware)
src/lib/roles.ts         Label peranan dan pembantu kebenaran UI
src/lib/org.ts           Konteks organisasi (org + peranan pengguna)
src/app/                 Halaman: login, daftar, onboarding, jemputan, akaun, o/[slug]/(utama|profil|pengguna|audit)
docs/                    Status pelaksanaan dan isu diketahui
```

## Prinsip keselamatan
- **Kebenaran dikuatkuasakan di pangkalan data** melalui RLS; butang yang disembunyikan di UI hanyalah kemudahan.
- Setiap jadual milik tenant mempunyai `organization_id` yang dikunci selepas dicipta.
- Pengguna baharu masuk ke organisasi **hanya melalui jemputan** yang sepadan dengan emel log masuk.
- Pengguna tidak boleh mengubah peranan sendiri; sekurang-kurangnya seorang Pentadbir mesti kekal.
- Log audit ditulis oleh pencetus pangkalan data, tidak boleh diubah atau dipadam; nombor akaun bank disorok (`****1234`).
- Akaun bank hanya kelihatan kepada Pentadbir, Nazir, Bendahari dan Pemeriksa.
