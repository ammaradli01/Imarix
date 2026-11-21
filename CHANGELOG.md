# Changelog

## [0.1.0] — 2026-11-21 — Fasa 1, langkah 1: Asas
### Ditambah
- Skema asas Supabase: `organizations`, `profiles`, `memberships`, `invitations`, `bank_accounts`, `audit_logs`.
- Row Level Security untuk semua jadual; fungsi `create_organization`, `accept_invitation`, `invitation_preview`.
- Pencetus log audit (dengan penyorokan nombor akaun bank), log tidak boleh diubah, kunci `organization_id`, sekurang-kurangnya seorang Pentadbir.
- 33 ujian pangkalan data automatik.
- Aplikasi Next.js: daftar, log masuk, pengesahan emel, daftar masjid, papan utama dengan senarai persediaan, profil masjid, akaun bank, pengguna dan peranan, jemputan dengan pautan, log audit, akaun saya.
