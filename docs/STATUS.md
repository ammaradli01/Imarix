# Status pelaksanaan — MASJID360

Dikemas kini: 21 November 2026

## Fasa 1
| Langkah | Skop | Status |
|---|---|---|
| 1 | Asas: log masuk, tenant, peranan, jemputan, profil masjid, akaun bank, log audit | **Siap — ujian pangkalan data lulus 33/33; aplikasi lulus build dan semakan jenis** |
| 2 | Modul kewangan: kutipan (D), resit (F), baucer (I) dengan kelulusan, buku tunai (C), lejar double-entry | Belum mula |
| 3 | Penyata bank dengan AI, laporan U/T/E/V/W/S | Belum mula (prototaip wujud) |
| 4 | Wizard pendaftaran penuh, import Excel, langganan dan bil | Belum mula — perlu keputusan payment gateway |

## Isu diketahui / belum dibuat
- **Belum diuji hujung-ke-hujung pada projek Supabase sebenar.** Lapisan pangkalan data diuji pada PostgreSQL 16 dengan stub `auth`; UI diuji melalui build dan semakan halaman log masuk. Perlu satu pusingan ujian manual selepas projek Supabase dicipta.
- Jemputan tidak dihantar melalui emel secara automatik; Pentadbir menyalin pautan dan menghantarnya sendiri (WhatsApp/emel). Perkhidmatan emel (cth. Resend) akan ditambah.
- Log audit belum merekod alamat IP/peranti.
- MFA untuk Nazir dan Bendahari belum diaktifkan (Supabase menyokong TOTP; akan ditambah).
- Muat naik logo masjid belum ada (lajur `logo_path` disediakan).
- Bahasa Inggeris belum disokong (antara muka dalam Bahasa Melayu sahaja).
- Lupa kata laluan belum ada halaman sendiri.
- Ujian automatik untuk antara muka (Playwright) belum ditulis.

## Keputusan yang dibuat
- Hosting: Supabase, rantau Singapura (21 Nov 2026).
- Kod sumber: repo GitHub baharu (menunggu akaun GitHub disambungkan).

## Keputusan tertunggak
- Siapa yang membayar: masjid sendiri atau JAIS secara pukal.
- Payment gateway untuk langganan.
- Bank utama yang perlu disokong dahulu untuk penyata bank.
