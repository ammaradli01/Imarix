-- IMARIX — Langganan (subscription) dan invois
-- Harga: RM90 sebulan atau RM1,000 setahun. Percubaan percuma 30 hari untuk setiap organisasi baharu.
-- Harga ditetapkan di pelayan (app.plan_price), bukan dihantar oleh pelayar.
-- Pembayaran ditandakan 'dibayar' hanya oleh pelayan (service_role) — contohnya webhook gerbang pembayaran
-- yang telah disahkan tandatangannya — melalui public.mark_invoice_paid. Pengguna biasa tidak boleh.

create type public.subscription_status as enum ('percubaan', 'aktif', 'tamat', 'dibatalkan');
create type public.billing_cycle as enum ('bulanan', 'tahunan');
create type public.invoice_status as enum ('menunggu', 'dibayar', 'gagal', 'dibatalkan');

create table public.subscriptions (
  organization_id    uuid primary key references public.organizations(id) on delete cascade,
  plan               text not null default 'imarix',
  status             public.subscription_status not null default 'percubaan',
  billing_cycle      public.billing_cycle,
  trial_ends_at      timestamptz not null default (now() + interval '30 days'),
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.subscriptions is 'Satu langganan bagi setiap organisasi. Status dikira semula oleh app.subscription_state().';

create sequence public.invoice_no_seq;
create table public.subscription_invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_no      text not null unique,
  billing_cycle   public.billing_cycle not null,
  amount_sen      integer not null check (amount_sen > 0),
  status          public.invoice_status not null default 'menunggu',
  gateway         text,
  gateway_ref     text,
  paid_at         timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (gateway, gateway_ref)
);
create index subscription_invoices_org_idx on public.subscription_invoices (organization_id, created_at desc);

-- Harga di pelayan (sen)
create or replace function app.plan_price(p_cycle public.billing_cycle)
returns integer language sql immutable as $$
  select case p_cycle when 'bulanan' then 9000 when 'tahunan' then 100000 end;
$$;

-- Status berkesan pada masa ini (tanpa bergantung pada kerja berjadual)
create or replace function app.subscription_state(p_org uuid)
returns public.subscription_status language sql stable security definer set search_path = '' as $$
  select case
    when s.status = 'dibatalkan' then 'dibatalkan'::public.subscription_status
    when s.current_period_end is not null and s.current_period_end > now() then 'aktif'::public.subscription_status
    when s.current_period_end is null and s.trial_ends_at > now() then 'percubaan'::public.subscription_status
    else 'tamat'::public.subscription_status end
  from public.subscriptions s where s.organization_id = p_org;
$$;

-- Percubaan automatik untuk organisasi baharu
create or replace function app.start_trial()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.subscriptions (organization_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
create trigger organizations_start_trial after insert on public.organizations
  for each row execute function app.start_trial();

-- Isi untuk organisasi sedia ada
insert into public.subscriptions (organization_id) select id from public.organizations on conflict do nothing;

create trigger subscriptions_touch before update on public.subscriptions for each row execute function app.touch_updated_at();
create trigger subscription_invoices_touch before update on public.subscription_invoices for each row execute function app.touch_updated_at();
create trigger subscriptions_audit after insert or update or delete on public.subscriptions for each row execute function app.audit_row();
create trigger subscription_invoices_audit after insert or update or delete on public.subscription_invoices for each row execute function app.audit_row();
create trigger subscription_invoices_freeze_org before update on public.subscription_invoices for each row execute function app.freeze_org_id();

-- Minta invois: Pentadbir, Nazir atau Bendahari sahaja. Invois menunggu yang sama digunakan semula.
create or replace function public.request_subscription_invoice(p_org uuid, p_cycle public.billing_cycle)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_no text;
begin
  if auth.uid() is null then raise exception 'Perlu log masuk' using errcode = '42501'; end if;
  if not app.has_role(p_org, array['org_admin','chairman','treasurer']::public.app_role[]) then
    raise exception 'Hanya Pentadbir, Nazir atau Bendahari boleh menguruskan langganan' using errcode = '42501';
  end if;
  select id into v_id from public.subscription_invoices
   where organization_id = p_org and status = 'menunggu' and billing_cycle = p_cycle;
  if v_id is not null then return v_id; end if;
  update public.subscription_invoices set status = 'dibatalkan'
   where organization_id = p_org and status = 'menunggu';
  v_no := 'IMX-' || to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYYY') || '-' || lpad(nextval('public.invoice_no_seq')::text, 5, '0');
  insert into public.subscription_invoices (organization_id, invoice_no, billing_cycle, amount_sen, created_by)
  values (p_org, v_no, p_cycle, app.plan_price(p_cycle), auth.uid())
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.request_subscription_invoice(uuid, public.billing_cycle) from public;
grant execute on function public.request_subscription_invoice(uuid, public.billing_cycle) to authenticated;

-- Tandakan dibayar: hanya pelayan (service_role). Idempoten. Melanjutkan tempoh dari tarikh tamat semasa jika masih aktif.
create or replace function public.mark_invoice_paid(p_invoice uuid, p_gateway text, p_ref text)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.subscription_invoices; v_from timestamptz; v_end timestamptz;
begin
  select * into v from public.subscription_invoices where id = p_invoice for update;
  if not found then raise exception 'Invois tidak wujud'; end if;
  if v.status = 'dibayar' then return; end if;
  if v.status <> 'menunggu' then raise exception 'Invois tidak lagi menunggu bayaran'; end if;
  update public.subscription_invoices set status = 'dibayar', paid_at = now(), gateway = p_gateway, gateway_ref = p_ref where id = p_invoice;
  select greatest(now(), coalesce(current_period_end, now())) into v_from from public.subscriptions where organization_id = v.organization_id for update;
  v_end := v_from + case v.billing_cycle when 'bulanan' then interval '1 month' else interval '1 year' end;
  update public.subscriptions set status = 'aktif', billing_cycle = v.billing_cycle, current_period_end = v_end
   where organization_id = v.organization_id;
end; $$;
revoke all on function public.mark_invoice_paid(uuid, text, text) from public, authenticated, anon;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.mark_invoice_paid(uuid, text, text) to service_role';
  end if;
end $$;

-- RLS: ahli boleh melihat langganan; invois hanya untuk Pentadbir, Nazir, Bendahari. Tiada tulis terus.
alter table public.subscriptions enable row level security;
alter table public.subscription_invoices enable row level security;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (app.is_member(organization_id));
create policy invoices_select on public.subscription_invoices for select to authenticated
  using (app.has_role(organization_id, array['org_admin','chairman','treasurer']::public.app_role[]));
grant select on public.subscriptions, public.subscription_invoices to authenticated;
grant execute on function app.subscription_state(uuid) to authenticated;
