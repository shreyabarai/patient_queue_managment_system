create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'staff',
  created_at timestamp with time zone not null default now(),
  constraint staff_role_check check (role in ('staff', 'admin'))
);

create unique index if not exists staff_email_unique_idx
  on public.staff (lower(email));

alter table public.staff enable row level security;

create or replace function public.is_authorized_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

drop policy if exists "Staff can view their staff row" on public.staff;
create policy "Staff can view their staff row"
on public.staff
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

drop policy if exists "Anyone can insert doctors" on public.doctors;
drop policy if exists "Anyone can update doctors" on public.doctors;
drop policy if exists "Anyone can delete doctors" on public.doctors;
drop policy if exists "Staff can insert doctors" on public.doctors;
drop policy if exists "Staff can update doctors" on public.doctors;

create policy "Authorized staff can insert doctors"
on public.doctors
for insert
to authenticated
with check (public.is_authorized_staff());

create policy "Authorized staff can update doctors"
on public.doctors
for update
to authenticated
using (public.is_authorized_staff())
with check (public.is_authorized_staff());

create policy "Authorized staff can delete doctors"
on public.doctors
for delete
to authenticated
using (public.is_authorized_staff());

drop policy if exists "Anyone can insert patients" on public.patients;
drop policy if exists "Anyone can update patients" on public.patients;
drop policy if exists "Anyone can delete patients" on public.patients;
drop policy if exists "Staff can insert patients" on public.patients;
drop policy if exists "Staff can update patients" on public.patients;
drop policy if exists "Staff can delete patients" on public.patients;

create policy "Authorized staff can insert patients"
on public.patients
for insert
to authenticated
with check (public.is_authorized_staff());

create policy "Authorized staff can update patients"
on public.patients
for update
to authenticated
using (public.is_authorized_staff())
with check (public.is_authorized_staff());

create policy "Authorized staff can delete patients"
on public.patients
for delete
to authenticated
using (public.is_authorized_staff());

drop policy if exists "Anyone can insert announcements" on public.announcements;
drop policy if exists "Anyone can update announcements" on public.announcements;
drop policy if exists "Anyone can delete announcements" on public.announcements;
drop policy if exists "Staff can insert announcements" on public.announcements;
drop policy if exists "Staff can update announcements" on public.announcements;
drop policy if exists "Staff can delete announcements" on public.announcements;

create policy "Authorized staff can insert announcements"
on public.announcements
for insert
to authenticated
with check (public.is_authorized_staff());

create policy "Authorized staff can update announcements"
on public.announcements
for update
to authenticated
using (public.is_authorized_staff())
with check (public.is_authorized_staff());

create policy "Authorized staff can delete announcements"
on public.announcements
for delete
to authenticated
using (public.is_authorized_staff());
