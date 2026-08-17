create or replace function public.google_avatar_url_for(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		nullif(i.identity_data ->> 'avatar_url', ''),
		nullif(i.identity_data ->> 'picture', ''),
		nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
		nullif(u.raw_user_meta_data ->> 'picture', '')
	)
	from auth.users u
	left join lateral (
		select identity_data
		from auth.identities
		where user_id = u.id
			and provider = 'google'
		order by updated_at desc nulls last
		limit 1
	) i on true
	where u.id = uid;
$$;

create or replace function public.sync_google_avatar(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	google_avatar text;
begin
	google_avatar := public.google_avatar_url_for(uid);

	if google_avatar is null then
		return;
	end if;

	update public.users
	set
		avatar_url = google_avatar,
		updated_at = now()
	where id = uid
		and avatar_url is distinct from google_avatar;

	update public.championship_players
	set avatar_url = google_avatar
	where user_id = uid
		and avatar_url is distinct from google_avatar;
end;
$$;

create or replace function public.sync_google_avatar_from_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	perform public.sync_google_avatar(new.user_id);
	return new;
end;
$$;

create or replace function public.sync_platform_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	google_avatar text;
begin
	google_avatar := public.google_avatar_url_for(new.id);

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
		google_avatar
	)
	on conflict (id) do update
	set
		email = excluded.email,
		display_name = excluded.display_name,
		avatar_url = case
			when excluded.avatar_url is not null
				and excluded.avatar_url is distinct from public.users.avatar_url
			then excluded.avatar_url
			else public.users.avatar_url
		end,
		updated_at = now();

	perform public.sync_google_avatar(new.id);

	return new;
end;
$$;

create or replace function public.current_user_avatar_url()
returns text
language sql
stable
security definer
set search_path = public
as $$
	select public.google_avatar_url_for((select auth.uid()));
$$;

drop trigger if exists on_auth_google_identity_updated on auth.identities;
create trigger on_auth_google_identity_updated
	after insert or update of identity_data on auth.identities
	for each row
	when (new.provider = 'google')
	execute function public.sync_google_avatar_from_identity();

revoke all on function public.google_avatar_url_for(uuid) from public;
revoke all on function public.sync_google_avatar(uuid) from public;
revoke all on function public.sync_google_avatar_from_identity() from public;
revoke all on function public.sync_platform_user() from public;

notify pgrst, 'reload schema';
