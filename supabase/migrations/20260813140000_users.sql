create table public.users (
	id uuid primary key references auth.users (id) on delete cascade,
	email text,
	display_name text not null,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy users_select_own
	on public.users
	for select
	to authenticated
	using (id = (select auth.uid()));

create policy users_insert_own
	on public.users
	for insert
	to authenticated
	with check (id = (select auth.uid()));

create policy users_update_own
	on public.users
	for update
	to authenticated
	using (id = (select auth.uid()))
	with check (id = (select auth.uid()));

create or replace function public.sync_platform_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.users (id, email, display_name, avatar_url)
	values (
		new.id,
		new.email,
		coalesce(
			nullif(new.raw_user_meta_data ->> 'full_name', ''),
			nullif(new.raw_user_meta_data ->> 'name', ''),
			nullif(new.email, ''),
			'Jogador'
		),
		coalesce(
			nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
			nullif(new.raw_user_meta_data ->> 'picture', '')
		)
	)
	on conflict (id) do update
	set
		email = excluded.email,
		display_name = excluded.display_name,
		avatar_url = excluded.avatar_url,
		updated_at = now();

	return new;
end;
$$;

revoke all on function public.sync_platform_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row
	execute function public.sync_platform_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
	after update of email, raw_user_meta_data on auth.users
	for each row
	execute function public.sync_platform_user();

insert into public.users (id, email, display_name, avatar_url)
select
	u.id,
	u.email,
	coalesce(
		nullif(u.raw_user_meta_data ->> 'full_name', ''),
		nullif(u.raw_user_meta_data ->> 'name', ''),
		nullif(u.email, ''),
		'Jogador'
	),
	coalesce(
		nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
		nullif(u.raw_user_meta_data ->> 'picture', '')
	)
from auth.users u
on conflict (id) do update
set
	email = excluded.email,
	display_name = excluded.display_name,
	avatar_url = excluded.avatar_url,
	updated_at = now();

grant select, insert, update on public.users to authenticated;

notify pgrst, 'reload schema';
