-- IMARIX — Pentadbir platform (Fathi Global)
-- Pentadbir platform boleh: melihat senarai masjid dan status langganan, melihat semua invois,
-- dan menandakan invois dibayar selepas wang diterima. Mereka TIDAK mendapat akses kepada rekod
-- kewangan masjid: jadual masjid masih dilindungi RLS seperti biasa.

create table app.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table app.platform_admins is 'Pentadbir platform IMARIX. Ditambah secara manual melalui SQL sahaja.';

create or replace function app.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.platform_admins where user_id = auth.uid());
$$;
grant execute on function app.is_platform_admin() to authenticated;

create or replace function public.am_i_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_platform_admin();
$$;
grant execute on function public.am_i_platform_admin() to authenticated;

-- Senarai masjid: maklumat langganan dan bilangan ahli sahaja, tiada data kewangan.
create or replace function public.admin_organizations()
returns table (id uuid, name text, slug text, org_type public.org_type, district text, created_at timestamptz,
               state public.subscription_status, trial_ends_at timestamptz, current_period_end timestamptz,
               members bigint, last_activity timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_platform_admin() then raise exception 'Hanya pentadbir platform' using errcode = '42501'; end if;
  return query
    select o.id, o.name, o.slug, o.org_type, o.district, o.created_at,
           app.subscription_state(o.id), s.trial_ends_at, s.current_period_end,
           (select count(*) from public.memberships m where m.organization_id = o.id and m.status = 'active'),
           (select max(a.created_at) from public.audit_logs a where a.organization_id = o.id)
      from public.organizations o
      left join public.subscriptions s on s.organization_id = o.id
     order by o.created_at desc;
end; $$;
grant execute on function public.admin_organizations() to authenticated;

create or replace function public.admin_invoices()
returns table (id uuid, invoice_no text, organization_id uuid, org_name text, org_slug text,
               billing_cycle public.billing_cycle, amount_sen integer, status public.invoice_status,
               created_at timestamptz, paid_at timestamptz, gateway text, gateway_ref text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app.is_platform_admin() then raise exception 'Hanya pentadbir platform' using errcode = '42501'; end if;
  return query
    select i.id, i.invoice_no, i.organization_id, o.name, o.slug, i.billing_cycle, i.amount_sen, i.status,
           i.created_at, i.paid_at, i.gateway, i.gateway_ref
      from public.subscription_invoices i join public.organizations o on o.id = i.organization_id
     order by (i.status = 'menunggu') desc, i.created_at desc
     limit 300;
end; $$;
grant execute on function public.admin_invoices() to authenticated;

-- Tandakan dibayar secara manual (pindahan bank). Rujukan bank wajib dan unik.
create or replace function public.admin_mark_invoice_paid(p_invoice uuid, p_ref text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_platform_admin() then raise exception 'Hanya pentadbir platform' using errcode = '42501'; end if;
  if coalesce(trim(p_ref), '') = '' then raise exception 'Rujukan bayaran diperlukan' using errcode = '23514'; end if;
  perform public.mark_invoice_paid(p_invoice, 'pindahan_bank', trim(p_ref));
end; $$;
grant execute on function public.admin_mark_invoice_paid(uuid, text) to authenticated;

-- Batalkan invois yang tidak akan dibayar
create or replace function public.admin_cancel_invoice(p_invoice uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_platform_admin() then raise exception 'Hanya pentadbir platform' using errcode = '42501'; end if;
  update public.subscription_invoices set status = 'dibatalkan' where id = p_invoice and status = 'menunggu';
end; $$;
grant execute on function public.admin_cancel_invoice(uuid) to authenticated;
