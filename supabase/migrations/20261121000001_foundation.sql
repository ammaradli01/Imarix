-- MASJID360 — Fasa 1: Asas (tenant, pengguna, peranan, jemputan, log audit)
-- Semua jadual milik tenant membawa organization_id dan dilindungi Row Level Security.

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists app;
grant usage on schema app to authenticated;

-- ---------------------------------------------------------------------------
-- Jenis
-- ---------------------------------------------------------------------------
create type public.org_type as enum ('masjid', 'masjid_diwartakan', 'surau', 'surau_jumaat', 'musolla');
create type public.app_role as enum (
  'org_admin',   -- Pentadbir organisasi (urus pengguna dan tetapan)
  'chairman',    -- Nazir / Pengerusi (Pegawai Pengawal)
  'treasurer',   -- Bendahari (Pegawai Kewangan)
  'secretary',   -- Setiausaha
  'auditor',     -- Pemeriksa Kira-kira (baca sahaja)
  'committee'    -- AJK
);
create type public.membership_status as enum ('active', 'suspended');

-- ---------------------------------------------------------------------------
-- Jadual
-- ---------------------------------------------------------------------------
create table public.organizations (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$'),
  name              text not null check (char_length(name) between 3 and 150),
  org_type          public.org_type not null default 'masjid',
  state_code        text not null default 'SGR' check (state_code ~ '^[A-Z]{3}$'),
  district          text check (char_length(district) <= 80),
  address           text check (char_length(address) <= 300),
  postcode          text check (postcode ~ '^[0-9]{5}$'),
  phone             text check (char_length(phone) <= 30),
  email             citext check (char_length(email) <= 254),
  registration_no   text check (char_length(registration_no) <= 60),
  logo_path         text,
  fiscal_year_start smallint not null default 1 check (fiscal_year_start between 1 and 12),
  receipt_prefix    text not null default 'A' check (receipt_prefix ~ '^[A-Z0-9]{1,4}$'),
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.organizations is 'Satu masjid atau surau = satu tenant.';

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 30),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.app_role not null,
  status          public.membership_status not null default 'active',
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id, role)
);
create index memberships_user_idx on public.memberships (user_id) where status = 'active';
create index memberships_org_idx on public.memberships (organization_id);

create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           citext not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role            public.app_role not null,
  token           uuid not null unique default gen_random_uuid(),
  invited_by      uuid references auth.users(id) on delete set null,
  expires_at      timestamptz not null default now() + interval '7 days',
  accepted_at     timestamptz,
  accepted_by     uuid references auth.users(id) on delete set null,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index invitations_org_idx on public.invitations (organization_id);
create unique index invitations_pending_uniq on public.invitations (organization_id, email, role)
  where accepted_at is null and revoked_at is null;

create table public.bank_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  bank_name       text not null check (char_length(bank_name) <= 80),
  account_name    text not null check (char_length(account_name) <= 150),
  account_no      text not null check (account_no ~ '^[0-9 -]{6,30}$'),
  is_primary      boolean not null default false,
  mais_approval_ref text check (char_length(mais_approval_ref) <= 80), -- SOP 8.2.1: akaun tambahan perlu kebenaran MAIS
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index bank_accounts_one_primary on public.bank_accounts (organization_id) where is_primary;
create index bank_accounts_org_idx on public.bank_accounts (organization_id);

create table public.audit_logs (
  id              bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id        uuid,
  action          text not null,          -- INSERT / UPDATE / DELETE / atau tindakan aplikasi
  entity          text not null,          -- nama jadual atau modul
  entity_id       text,
  old_data        jsonb,
  new_data        jsonb,
  created_at      timestamptz not null default now()
);
create index audit_logs_org_time_idx on public.audit_logs (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Fungsi bantuan (SECURITY DEFINER: dibaca tanpa rekursi RLS)
-- ---------------------------------------------------------------------------
create or replace function app.has_role(p_org uuid, p_roles public.app_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = p_org and m.user_id = auth.uid()
      and m.status = 'active' and m.role = any (p_roles)
  );
$$;

create or replace function app.is_member(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = p_org and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function app.shares_org_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships a
    join public.memberships b on b.organization_id = a.organization_id
    where a.user_id = auth.uid() and a.status = 'active'
      and b.user_id = p_user and b.status = 'active'
  );
$$;

create or replace function app.user_in_org(p_org uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
                 where m.organization_id = p_org and m.user_id = p_user and m.status = 'active');
$$;
revoke all on function app.user_in_org(uuid, uuid) from public;
grant execute on function app.user_in_org(uuid, uuid) to authenticated;

revoke all on function app.has_role(uuid, public.app_role[]) from public;
revoke all on function app.is_member(uuid) from public;
revoke all on function app.shares_org_with(uuid) from public;
grant execute on function app.has_role(uuid, public.app_role[]) to authenticated;
grant execute on function app.is_member(uuid) to authenticated;
grant execute on function app.shares_org_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Pencetus: updated_at, profil automatik, log audit, perlindungan
-- ---------------------------------------------------------------------------
create or replace function app.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger organizations_touch before update on public.organizations
  for each row execute function app.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function app.touch_updated_at();
create trigger bank_accounts_touch before update on public.bank_accounts
  for each row execute function app.touch_updated_at();

create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_user();

-- Log audit generik. Nombor akaun bank disorok kecuali 4 digit terakhir.
create or replace function app.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  v_org uuid;
  v_id  text;
begin
  if tg_table_name = 'bank_accounts' then
    if v_old ? 'account_no' then v_old := jsonb_set(v_old, '{account_no}', to_jsonb('****' || right(v_old->>'account_no', 4))); end if;
    if v_new ? 'account_no' then v_new := jsonb_set(v_new, '{account_no}', to_jsonb('****' || right(v_new->>'account_no', 4))); end if;
  end if;
  if tg_table_name = 'invitations' then
    v_old := v_old - 'token'; v_new := v_new - 'token';
  end if;
  if tg_op = 'UPDATE' and v_old - 'updated_at' = v_new - 'updated_at' then
    return new; -- tiada perubahan bermakna
  end if;
  v_org := case when tg_table_name = 'organizations'
                then coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid)
                else coalesce((v_new->>'organization_id')::uuid, (v_old->>'organization_id')::uuid) end;
  v_id := coalesce(v_new->>'id', v_old->>'id');
  insert into public.audit_logs (organization_id, actor_id, action, entity, entity_id, old_data, new_data)
  values (v_org, auth.uid(), tg_op, tg_table_name, v_id, v_old, v_new);
  return coalesce(new, old);
end; $$;

create trigger organizations_audit after insert or update or delete on public.organizations
  for each row execute function app.audit_row();
create trigger memberships_audit after insert or update or delete on public.memberships
  for each row execute function app.audit_row();
create trigger invitations_audit after insert or update or delete on public.invitations
  for each row execute function app.audit_row();
create trigger bank_accounts_audit after insert or update or delete on public.bank_accounts
  for each row execute function app.audit_row();

-- Log audit tidak boleh diubah atau dipadam.
create or replace function app.audit_immutable()
returns trigger language plpgsql as $$
begin raise exception 'Log audit tidak boleh diubah atau dipadam' using errcode = '42501'; end; $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function app.audit_immutable();

-- Sekurang-kurangnya seorang org_admin aktif mesti kekal.
create or replace function app.keep_one_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_org uuid := old.organization_id;
begin
  if old.role = 'org_admin' and old.status = 'active'
     and (tg_op = 'DELETE' or new.status <> 'active' or new.role <> 'org_admin')
     and exists (select 1 from public.organizations o where o.id = v_org) then
    if not exists (select 1 from public.memberships m
                   where m.organization_id = v_org and m.role = 'org_admin'
                     and m.status = 'active' and m.id <> old.id) then
      raise exception 'Organisasi mesti mempunyai sekurang-kurangnya seorang pentadbir' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end; $$;
create trigger memberships_keep_admin before update or delete on public.memberships
  for each row execute function app.keep_one_admin();

-- organization_id tidak boleh dipindah selepas dicipta.
create or replace function app.freeze_org_id()
returns trigger language plpgsql as $$
begin
  if new.organization_id <> old.organization_id then
    raise exception 'organization_id tidak boleh diubah' using errcode = '42501';
  end if;
  return new;
end; $$;
create trigger memberships_freeze_org before update on public.memberships for each row execute function app.freeze_org_id();
create trigger invitations_freeze_org before update on public.invitations for each row execute function app.freeze_org_id();
create trigger bank_accounts_freeze_org before update on public.bank_accounts for each row execute function app.freeze_org_id();

-- ---------------------------------------------------------------------------
-- RPC
-- ---------------------------------------------------------------------------
-- Cipta masjid/surau baharu; pencipta menjadi org_admin + peranan yang dipilih.
create or replace function public.create_organization(
  p_name text, p_slug text, p_org_type public.org_type, p_district text, p_my_role public.app_role
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_org uuid;
begin
  if v_uid is null then raise exception 'Perlu log masuk' using errcode = '42501'; end if;
  if p_my_role = 'org_admin' then p_my_role := null; end if;
  insert into public.organizations (name, slug, org_type, district, created_by)
  values (trim(p_name), lower(trim(p_slug)), p_org_type, nullif(trim(p_district), ''), v_uid)
  returning id into v_org;
  insert into public.memberships (organization_id, user_id, role, created_by) values (v_org, v_uid, 'org_admin', v_uid);
  if p_my_role is not null then
    insert into public.memberships (organization_id, user_id, role, created_by) values (v_org, v_uid, p_my_role, v_uid);
  end if;
  return v_org;
end; $$;
revoke all on function public.create_organization(text, text, public.org_type, text, public.app_role) from public;
grant execute on function public.create_organization(text, text, public.org_type, text, public.app_role) to authenticated;

-- Terima jemputan: emel log masuk mesti sama dengan emel jemputan.
create or replace function public.accept_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_email text := lower(auth.jwt()->>'email'); v_inv public.invitations;
begin
  if v_uid is null then raise exception 'Perlu log masuk' using errcode = '42501'; end if;
  select * into v_inv from public.invitations where token = p_token for update;
  if not found or v_inv.revoked_at is not null then raise exception 'Jemputan tidak sah' using errcode = 'P0002'; end if;
  if v_inv.accepted_at is not null then raise exception 'Jemputan telah digunakan' using errcode = 'P0001'; end if;
  if v_inv.expires_at < now() then raise exception 'Jemputan telah tamat tempoh' using errcode = 'P0001'; end if;
  if lower(v_inv.email::text) <> v_email then
    raise exception 'Jemputan ini untuk emel lain' using errcode = '42501';
  end if;
  insert into public.memberships (organization_id, user_id, role, created_by)
  values (v_inv.organization_id, v_uid, v_inv.role, v_inv.invited_by)
  on conflict (organization_id, user_id, role) do update set status = 'active';
  update public.invitations set accepted_at = now(), accepted_by = v_uid where id = v_inv.id;
  return v_inv.organization_id;
end; $$;
revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- Maklumat jemputan untuk halaman terima (tanpa mendedahkan data lain).
create or replace function public.invitation_preview(p_token uuid)
returns table (organization_name text, role public.app_role, email text, expired boolean, used boolean)
language sql stable security definer set search_path = '' as $$
  select o.name, i.role, i.email::text, i.expires_at < now(), (i.accepted_at is not null or i.revoked_at is not null)
  from public.invitations i join public.organizations o on o.id = i.organization_id
  where i.token = p_token;
$$;
revoke all on function public.invitation_preview(uuid) from public;
grant execute on function public.invitation_preview(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.memberships   enable row level security;
alter table public.invitations   enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.audit_logs    enable row level security;

-- organizations: ahli boleh baca; Pentadbir, Nazir dan Setiausaha boleh kemas kini profil.
create policy org_select on public.organizations for select to authenticated
  using (app.is_member(id));
create policy org_update on public.organizations for update to authenticated
  using (app.has_role(id, array['org_admin','chairman','secretary']::public.app_role[]))
  with check (app.has_role(id, array['org_admin','chairman','secretary']::public.app_role[]));
-- Tiada polisi insert/delete: cipta melalui create_organization(); padam hanya oleh pentadbir SaaS.

-- profiles: sendiri boleh baca/kemas kini; rakan sekariah boleh baca nama.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or app.shares_org_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- memberships: ahli boleh lihat senarai; Pentadbir/Nazir urus peranan orang lain (bukan diri sendiri).
create policy memberships_select on public.memberships for select to authenticated
  using (app.is_member(organization_id));
create policy memberships_insert on public.memberships for insert to authenticated
  with check (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[])
              and user_id <> auth.uid()
              and app.user_in_org(organization_id, user_id)  -- pengguna baharu masuk hanya melalui jemputan
              and (role <> 'org_admin' or app.has_role(organization_id, array['org_admin']::public.app_role[])));
create policy memberships_update on public.memberships for update to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[]) and user_id <> auth.uid()
         and (role <> 'org_admin' or app.has_role(organization_id, array['org_admin']::public.app_role[])))
  with check (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[]) and user_id <> auth.uid()
              and (role <> 'org_admin' or app.has_role(organization_id, array['org_admin']::public.app_role[])));
create policy memberships_delete on public.memberships for delete to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[]) and user_id <> auth.uid()
         and (role <> 'org_admin' or app.has_role(organization_id, array['org_admin']::public.app_role[])));

-- invitations: Pentadbir/Nazir sahaja. Jemputan org_admin hanya oleh org_admin.
create policy invitations_select on public.invitations for select to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[]));
create policy invitations_insert on public.invitations for insert to authenticated
  with check (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[])
              and invited_by = auth.uid() and accepted_at is null
              and (role <> 'org_admin' or app.has_role(organization_id, array['org_admin']::public.app_role[])));
create policy invitations_update on public.invitations for update to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[]))
  with check (app.has_role(organization_id, array['org_admin','chairman']::public.app_role[]) and accepted_at is null);

-- bank_accounts: hanya Pentadbir, Nazir, Bendahari, Pemeriksa boleh lihat; Pentadbir/Bendahari urus.
create policy bank_select on public.bank_accounts for select to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman','treasurer','auditor']::public.app_role[]));
create policy bank_insert on public.bank_accounts for insert to authenticated
  with check (app.has_role(organization_id, array['org_admin','treasurer']::public.app_role[]));
create policy bank_update on public.bank_accounts for update to authenticated
  using (app.has_role(organization_id, array['org_admin','treasurer']::public.app_role[]))
  with check (app.has_role(organization_id, array['org_admin','treasurer']::public.app_role[]));
create policy bank_delete on public.bank_accounts for delete to authenticated
  using (app.has_role(organization_id, array['org_admin']::public.app_role[]));

-- audit_logs: baca sahaja untuk Pentadbir, Nazir, Pemeriksa. Ditulis hanya oleh pencetus.
create policy audit_select on public.audit_logs for select to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman','auditor']::public.app_role[]));

-- Hak asas
grant select, update on public.organizations to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update on public.invitations to authenticated;
grant select, insert, update, delete on public.bank_accounts to authenticated;
grant select on public.audit_logs to authenticated;
revoke all on public.organizations, public.profiles, public.memberships, public.invitations,
              public.bank_accounts, public.audit_logs from anon;
