-- Ujian pengasingan tenant, peranan dan log audit.
\set ON_ERROR_STOP on
create temp table _r (n serial, ok boolean, name text);
grant all on _r, _r_n_seq to authenticated, anon;
\o /dev/null
create or replace function pg_temp.ok(b boolean, msg text) returns void language sql as $$ insert into _r(ok,name) values (coalesce(b,false), msg) $$;
create or replace function pg_temp.fails(q text, msg text) returns void language plpgsql as $$
begin
  begin execute q; insert into _r(ok,name) values (false, msg || ' (tidak gagal)');
  exception when others then insert into _r(ok,name) values (true, msg); end;
end $$;
create or replace function pg_temp.login(u uuid, email text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',u,'email',email,'role','authenticated')::text, false); end $$;

-- Pengguna
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','ahmad@a.my','{"full_name":"Ahmad Bendahari A"}'),
 ('00000000-0000-0000-0000-00000000000b','salleh@a.my','{"full_name":"Salleh Nazir A"}'),
 ('00000000-0000-0000-0000-00000000000c','zainal@b.my','{"full_name":"Zainal Admin B"}'),
 ('00000000-0000-0000-0000-00000000000d','ajk@a.my','{"full_name":"Kamarul AJK A"}'),
 ('00000000-0000-0000-0000-00000000000e','orangluar@x.my','{"full_name":"Orang Luar"}');

select pg_temp.ok((select count(*) from public.profiles)=5, 'Profil dicipta automatik untuk pengguna baharu');

set role authenticated;
-- Ahmad cipta Masjid A sebagai Bendahari
select pg_temp.login('00000000-0000-0000-0000-00000000000a','ahmad@a.my');
select public.create_organization('Masjid Al-Hidayah','al-hidayah','masjid','Hulu Langat','treasurer') as org_a \gset
select pg_temp.ok((select count(*) from public.memberships where organization_id=:'org_a')=2, 'Pencipta mendapat peranan org_admin + Bendahari');
-- Zainal cipta Masjid B
select pg_temp.login('00000000-0000-0000-0000-00000000000c','zainal@b.my');
select public.create_organization('Surau An-Nur','an-nur','surau','Sepang','chairman') as org_b \gset
select set_config('t.org_a', :'org_a', false);

-- PENGASINGAN TENANT
select pg_temp.ok((select count(*) from public.organizations)=1, 'Admin B hanya nampak organisasinya sendiri');
select pg_temp.ok((select count(*) from public.organizations where id=:'org_a')=0, 'Admin B tidak boleh baca Masjid A walaupun dengan id');
update public.organizations set name='DIGODAM' where id=:'org_a';
select pg_temp.ok((select count(*) from public.memberships where organization_id=:'org_a')=0, 'Admin B tidak nampak ahli Masjid A');
select pg_temp.fails($$insert into public.memberships(organization_id,user_id,role) values ('$$||:'org_a'||$$','00000000-0000-0000-0000-00000000000c','org_admin')$$, 'Admin B tidak boleh menambah diri ke Masjid A');
select pg_temp.fails($$insert into public.invitations(organization_id,email,role,invited_by) values ('$$||:'org_a'||$$','zainal@b.my','org_admin','00000000-0000-0000-0000-00000000000c')$$, 'Admin B tidak boleh mencipta jemputan untuk Masjid A');
select pg_temp.ok((select count(*) from public.audit_logs where organization_id=:'org_a')=0, 'Admin B tidak boleh baca log audit Masjid A');
-- cuba pindah ahli sendiri ke org A dengan menukar organization_id
do $$ begin
  begin update public.memberships set organization_id=(select current_setting('t.org_a')::uuid) where role='chairman'; exception when others then null; end;
end $$;
reset role;
select pg_temp.ok((select count(*) from public.memberships where organization_id=:'org_a' and user_id='00000000-0000-0000-0000-00000000000c')=0, 'Menukar organization_id tidak boleh memintas pengasingan');
select pg_temp.fails($$update public.memberships set organization_id='$$||:'org_a'||$$' where organization_id='$$||:'org_b'||$$'$$, 'organization_id dikunci walaupun oleh pentadbir pangkalan data');
set role authenticated;

select pg_temp.login('00000000-0000-0000-0000-00000000000a','ahmad@a.my');
select pg_temp.ok((select name from public.organizations where id=:'org_a')='Masjid Al-Hidayah', 'Kemas kini daripada tenant lain tidak memberi kesan');

-- JEMPUTAN
insert into public.invitations(organization_id,email,role,invited_by) values (:'org_a','salleh@a.my','chairman','00000000-0000-0000-0000-00000000000a');
insert into public.invitations(organization_id,email,role,invited_by) values (:'org_a','ajk@a.my','committee','00000000-0000-0000-0000-00000000000a');
select token as tok_salleh from public.invitations where email='salleh@a.my' \gset
select token as tok_ajk from public.invitations where email='ajk@a.my' \gset
select pg_temp.login('00000000-0000-0000-0000-00000000000e','orangluar@x.my');
select pg_temp.fails($$select public.accept_invitation('$$||:'tok_salleh'||$$')$$, 'Jemputan tidak boleh digunakan oleh emel lain');
select pg_temp.login('00000000-0000-0000-0000-00000000000b','salleh@a.my');
select public.accept_invitation(:'tok_salleh');
select pg_temp.ok(app.has_role(:'org_a', array['chairman']::public.app_role[]), 'Nazir menyertai melalui jemputan');
select pg_temp.fails($$select public.accept_invitation('$$||:'tok_salleh'||$$')$$, 'Jemputan tidak boleh digunakan dua kali');
select pg_temp.login('00000000-0000-0000-0000-00000000000d','ajk@a.my');
select public.accept_invitation(:'tok_ajk');

-- PERANAN
-- AJK tidak boleh edit profil masjid
update public.organizations set name='Ditukar AJK' where id=:'org_a';
select pg_temp.login('00000000-0000-0000-0000-00000000000a','ahmad@a.my');
select pg_temp.ok((select name from public.organizations where id=:'org_a')='Masjid Al-Hidayah', 'AJK tidak boleh mengubah profil masjid');
select pg_temp.login('00000000-0000-0000-0000-00000000000d','ajk@a.my');
select pg_temp.fails($$insert into public.memberships(organization_id,user_id,role) values ('$$||:'org_a'||$$','00000000-0000-0000-0000-00000000000d','org_admin')$$, 'AJK tidak boleh menaikkan peranan sendiri');
select pg_temp.ok((select count(*) from public.bank_accounts)=0 and (select count(*) from public.audit_logs)=0, 'AJK tidak boleh lihat akaun bank atau log audit');
select pg_temp.fails($$insert into public.bank_accounts(organization_id,bank_name,account_name,account_no) values ('$$||:'org_a'||$$','Bank Islam','Masjid','1209010045218')$$, 'AJK tidak boleh menambah akaun bank');
select pg_temp.ok((select count(*) from public.profiles)=3, 'AJK nampak nama rakan sekariah sahaja (3), bukan pengguna masjid lain');

-- Nazir edit profil
select pg_temp.login('00000000-0000-0000-0000-00000000000b','salleh@a.my');
update public.organizations set name='Masjid Al-Hidayah Kajang', district='Hulu Langat' where id=:'org_a';
select pg_temp.ok((select name from public.organizations where id=:'org_a')='Masjid Al-Hidayah Kajang', 'Nazir boleh menukar nama masjid');
select pg_temp.fails($$insert into public.memberships(organization_id,user_id,role) values ('$$||:'org_a'||$$','00000000-0000-0000-0000-00000000000e','treasurer')$$, 'Pengguna luar tidak boleh ditambah terus tanpa jemputan');
insert into public.memberships(organization_id,user_id,role) values (:'org_a','00000000-0000-0000-0000-00000000000d','secretary');
select pg_temp.ok((select count(*) from public.memberships where user_id='00000000-0000-0000-0000-00000000000d')=2, 'Nazir boleh menambah peranan Setiausaha kepada ahli sedia ada');
select pg_temp.fails($$insert into public.memberships(organization_id,user_id,role) values ('$$||:'org_a'||$$','00000000-0000-0000-0000-00000000000d','org_admin')$$, 'Nazir (bukan pentadbir) tidak boleh melantik pentadbir');

-- Bendahari tambah akaun bank; log audit menyorok nombor akaun
select pg_temp.login('00000000-0000-0000-0000-00000000000a','ahmad@a.my');
insert into public.bank_accounts(organization_id,bank_name,account_name,account_no,is_primary) values (:'org_a','Bank Islam','Masjid Al-Hidayah','12090100452188',true);
select pg_temp.ok((select new_data->>'account_no' from public.audit_logs where entity='bank_accounts' order by id desc limit 1)='****2188', 'Log audit menyorok nombor akaun bank');
select pg_temp.ok((select count(*) from public.audit_logs where entity='organizations' and action='UPDATE' and old_data->>'name'='Masjid Al-Hidayah')=1, 'Perubahan nama masjid direkod dengan nilai lama');
select pg_temp.ok((select actor_id from public.audit_logs where entity='organizations' and action='UPDATE' limit 1)='00000000-0000-0000-0000-00000000000b', 'Log audit merekod siapa membuat perubahan');
select pg_temp.fails($$update public.audit_logs set action='X'$$, 'Log audit tidak boleh diubah');
select pg_temp.fails($$delete from public.audit_logs$$, 'Log audit tidak boleh dipadam');
select pg_temp.fails($$insert into public.audit_logs(organization_id,action,entity) values ('$$||:'org_a'||$$','X','palsu')$$, 'Log audit tidak boleh ditulis terus');

-- Pentadbir terakhir tidak boleh dibuang
reset role;
select pg_temp.fails($$delete from public.memberships where organization_id='$$||:'org_a'||$$' and role='org_admin'$$, 'Pentadbir terakhir tidak boleh dibuang');
set role authenticated;

-- Pengguna tanpa log masuk
select set_config('request.jwt.claims','',false);
select pg_temp.ok((select count(*) from public.organizations)=0, 'Pengguna tanpa log masuk tidak nampak apa-apa');
select pg_temp.fails($$select public.create_organization('X','xxx','masjid','','treasurer')$$, 'Tanpa log masuk tidak boleh mencipta organisasi');
reset role;
set role anon;
select pg_temp.fails($$select count(*) from public.organizations$$, 'Peranan anon tiada akses ke jadual');
reset role;

-- LANGGANAN
select pg_temp.ok((select count(*) from public.subscriptions)=2, 'Setiap organisasi baharu mendapat langganan');
select pg_temp.ok((select app.subscription_state(:'org_a'))='percubaan', 'Organisasi baharu dalam tempoh percubaan');
select pg_temp.ok((select trial_ends_at::date from public.subscriptions where organization_id=:'org_a')=(now()+interval '30 days')::date, 'Percubaan 30 hari');
set role authenticated;
select pg_temp.login('00000000-0000-0000-0000-00000000000d','ajk@a.my');
select pg_temp.ok((select count(*) from public.subscriptions)=1, 'AJK boleh melihat status langganan masjidnya');
select pg_temp.ok((select count(*) from public.subscription_invoices)=0, 'AJK tidak boleh melihat invois');
select pg_temp.fails($$select public.request_subscription_invoice('$$||:'org_a'||$$','bulanan')$$, 'AJK tidak boleh meminta invois');
select pg_temp.login('00000000-0000-0000-0000-00000000000c','zainal@b.my');
select pg_temp.fails($$select public.request_subscription_invoice('$$||:'org_a'||$$','bulanan')$$, 'Admin B tidak boleh meminta invois untuk Masjid A');
select pg_temp.ok((select count(*) from public.subscriptions where organization_id=:'org_a')=0, 'Admin B tidak nampak langganan Masjid A');
select pg_temp.login('00000000-0000-0000-0000-00000000000a','ahmad@a.my');
select public.request_subscription_invoice(:'org_a','tahunan') as inv1 \gset
select pg_temp.ok((select amount_sen from public.subscription_invoices where id=:'inv1')=100000, 'Harga tahunan RM1,000 ditetapkan pelayan');
select pg_temp.ok((select public.request_subscription_invoice(:'org_a','tahunan'))=:'inv1', 'Invois menunggu yang sama digunakan semula');
select public.request_subscription_invoice(:'org_a','bulanan') as inv2 \gset
select pg_temp.ok((select amount_sen from public.subscription_invoices where id=:'inv2')=9000, 'Harga bulanan RM90');
select pg_temp.ok((select status from public.subscription_invoices where id=:'inv1')='dibatalkan', 'Invois lama dibatalkan apabila kitaran ditukar');
select pg_temp.fails($$update public.subscription_invoices set status='dibayar'$$, 'Bendahari tidak boleh menanda invois dibayar sendiri');
select pg_temp.fails($$update public.subscriptions set status='aktif', current_period_end=now()+interval '9 years'$$, 'Langganan tidak boleh diubah terus oleh pengguna');
select pg_temp.fails($$select public.mark_invoice_paid('$$||:'inv2'||$$','toyyibpay','X1')$$, 'Pengguna tidak boleh memanggil fungsi pengesahan bayaran');
reset role;
select public.mark_invoice_paid(:'inv2','toyyibpay','BILL-001');
select public.mark_invoice_paid(:'inv2','toyyibpay','BILL-001');
select pg_temp.ok((select app.subscription_state(:'org_a'))='aktif', 'Bayaran disahkan mengaktifkan langganan');
select pg_temp.ok((select current_period_end::date from public.subscriptions where organization_id=:'org_a')=(now()+interval '1 month')::date, 'Webhook berulang tidak melanjutkan tempoh dua kali');
select pg_temp.ok((select count(*) from public.audit_logs where entity='subscription_invoices')>=3, 'Perubahan invois direkod dalam log audit');
update public.subscriptions set trial_ends_at=now()-interval '1 day' where organization_id=:'org_b';
select pg_temp.ok((select app.subscription_state(:'org_b'))='tamat', 'Percubaan yang luput menjadi tamat');

-- PENTADBIR PLATFORM
insert into app.platform_admins(user_id) values ('00000000-0000-0000-0000-00000000000e');
select public.request_subscription_invoice(:'org_a','tahunan') as inv3 \gset
set role authenticated;
select pg_temp.login('00000000-0000-0000-0000-00000000000a','ahmad@a.my');
select pg_temp.fails($$select * from public.admin_invoices()$$, 'Pentadbir masjid tidak boleh membuka panel platform');
select pg_temp.fails($$select public.admin_mark_invoice_paid('$$||:'inv3'||$$','X')$$, 'Pentadbir masjid tidak boleh menanda invois dibayar');
select pg_temp.ok(not public.am_i_platform_admin(), 'Pengguna biasa bukan pentadbir platform');
select pg_temp.login('00000000-0000-0000-0000-00000000000e','orangluar@x.my');
select pg_temp.ok(public.am_i_platform_admin(), 'Pentadbir platform dikenali');
select pg_temp.ok((select count(*) from public.admin_organizations())=2, 'Pentadbir platform nampak semua masjid');
select pg_temp.ok((select count(*) from public.admin_invoices() where status='menunggu')>=1, 'Pentadbir platform nampak invois menunggu');
select pg_temp.ok((select count(*) from public.organizations)=0, 'Pentadbir platform tidak dapat akses terus jadual masjid');
select pg_temp.fails($$select public.admin_mark_invoice_paid('$$||:'inv3'||$$','  ')$$, 'Rujukan bayaran wajib');
select public.admin_mark_invoice_paid(:'inv3','MBB-778899');
select pg_temp.ok((select status from public.admin_invoices() where id=:'inv3')='dibayar', 'Pentadbir platform menanda invois dibayar');
reset role;
select pg_temp.ok((select actor_id from public.audit_logs where entity='subscription_invoices' and entity_id=:'inv3' and action='UPDATE' order by created_at desc limit 1)='00000000-0000-0000-0000-00000000000e', 'Tindakan pentadbir platform direkod dalam log audit');

-- Keputusan
\o
select n, case when ok then 'LULUS' else 'GAGAL' end as keputusan, name from _r order by n;
do $$ declare f int; t int; begin
  select count(*) filter (where not ok), count(*) into f, t from _r;
  raise notice '% / % ujian lulus', t-f, t;
  if f > 0 then raise exception '% ujian gagal', f; end if;
end $$;
